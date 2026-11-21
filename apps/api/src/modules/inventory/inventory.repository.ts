import { and, eq, inArray } from "drizzle-orm";
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
