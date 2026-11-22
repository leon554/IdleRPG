import { and, asc, desc, eq, gt, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { equipment, equipmentCollection, inventory, rarity, resourceCollection, resources } from "../../db/schema.js";
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


export async function insertInventoryIfMissing(userId: string, maxSpace: number, conn: Connection = db) {
    await conn.insert(inventory).values({ userId, maxSpace }).onConflictDoNothing({ target: inventory.userId });
}


export async function addToResourceStacks( inventoryId: string, stacks: { resourceId: string; rarityId: string; amount: number }[],conn: Connection = db,
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

export async function findInventoryByUser(userId: string, conn: Connection = db) {
    const rows = await conn
        .select({ id: inventory.id, gold: inventory.gold, maxSpace: inventory.maxSpace })
        .from(inventory)
        .where(eq(inventory.userId, userId));
    return firstOrNull(rows)
}

export async function findResourceStacks(inventoryId: string, conn: Connection = db) {
    return conn
        .select({ resource: resources, rarity, quantity: resourceCollection.quantity })
        .from(resourceCollection)
        .innerJoin(resources, eq(resources.id, resourceCollection.resourceId))
        .innerJoin(rarity, eq(rarity.id, resourceCollection.rarityId))
        .where(and(eq(resourceCollection.inventoryId, inventoryId), gt(resourceCollection.quantity, 0)))
        .orderBy(asc(resources.itemName), desc(rarity.tier));
}

export async function findEquipmentStacks(inventoryId: string, conn: Connection = db) {
    return conn
        .select({ equipment, rarity, quantity: equipmentCollection.quantity })
        .from(equipmentCollection)
        .innerJoin(equipment, eq(equipment.id, equipmentCollection.equipmentId))
        .innerJoin(rarity, eq(rarity.id, equipmentCollection.rarityId))
        .where(and(eq(equipmentCollection.inventoryId, inventoryId), gt(equipmentCollection.quantity, 0)))
        .orderBy(asc(equipment.name), desc(rarity.tier));
}
