import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { inventory, resourceCollection } from "../../db/schema.js";
import type { Connection } from "../../types/db.js";

export async function findUserInventoryId(userId: string, conn: Connection = db): Promise<string | null> {
    const rows = await conn
        .select({ id: inventory.id })
        .from(inventory)
        .where(eq(inventory.userId, userId));

    return firstOrNull(rows)?.id ?? null
}

export async function findOwnedResources(inventoryId: string, resourceIds: string[], conn: Connection = db) {
    if (resourceIds.length === 0) return []

    return conn
        .select({
            resourceId: resourceCollection.resourceId,
            rarityId: resourceCollection.rarityId,
            quantity: resourceCollection.quantity,
        })
        .from(resourceCollection)
        .where(
            and(
                eq(resourceCollection.inventoryId, inventoryId),
                inArray(resourceCollection.resourceId, resourceIds),
            ),
        );
}

// Creates the user's inventory if they don't have one (does nothing if they do)
export async function insertInventoryIfMissing(userId: string, maxSpace: number, conn: Connection = db) {
    await conn.insert(inventory).values({ userId, maxSpace }).onConflictDoNothing({ target: inventory.userId });
}

// Adds to existing stacks, or creates them: quantity = quantity + amount
export async function addToResourceStacks(
    inventoryId: string,
    stacks: { resourceId: string; rarityId: string; amount: number }[],
    conn: Connection = db,
) {
    if (stacks.length === 0) return

    await conn
        .insert(resourceCollection)
        .values(stacks.map((s) => ({ inventoryId, resourceId: s.resourceId, rarityId: s.rarityId, quantity: s.amount })))
        .onConflictDoUpdate({
            target: [resourceCollection.inventoryId, resourceCollection.resourceId, resourceCollection.rarityId],
            set: { quantity: sql`${resourceCollection.quantity} + excluded.quantity` },
        });
}
