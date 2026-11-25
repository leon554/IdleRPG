import { and, asc, countDistinct, desc, eq, gt, gte, inArray, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { equipment, equipmentCollection, equipmentStats, inventory, rarity, resourceCollection, resources } from "../../db/schema.js";
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

export async function addToEquipmentStacks(inventoryId: string, stacks: { equipmentId: string; rarityId: string; amount: number }[], conn: Connection = db) {
    if (stacks.length === 0) return

    await conn
        .insert(equipmentCollection)
        .values(stacks.map((s) => ({ inventoryId, equipmentId: s.equipmentId, rarityId: s.rarityId, quantity: s.amount })))
        .onConflictDoUpdate({
            target: [equipmentCollection.inventoryId, equipmentCollection.equipmentId, equipmentCollection.rarityId],
            set: { quantity: sql`${equipmentCollection.quantity} + excluded.quantity` },
        });
}

export async function countDistinctItems(inventoryId: string, conn: Connection = db): Promise<number> {
    const [resourceCount] = await conn
        .select({ n: countDistinct(resourceCollection.resourceId) })
        .from(resourceCollection)
        .where(and(eq(resourceCollection.inventoryId, inventoryId), gt(resourceCollection.quantity, 0)));
    const [equipmentCount] = await conn
        .select({ n: countDistinct(equipmentCollection.equipmentId) })
        .from(equipmentCollection)
        .where(and(eq(equipmentCollection.inventoryId, inventoryId), gt(equipmentCollection.quantity, 0)));
    return Number(resourceCount?.n ?? 0) + Number(equipmentCount?.n ?? 0);
}

export async function holdsItem(inventoryId: string, itemType: "resource" | "equipment", itemId: string, conn: Connection = db): Promise<boolean> {
    const rows = itemType === "resource"
        ? await conn.select({ id: resourceCollection.resourceId }).from(resourceCollection)
            .where(and(eq(resourceCollection.inventoryId, inventoryId), eq(resourceCollection.resourceId, itemId), gt(resourceCollection.quantity, 0))).limit(1)
        : await conn.select({ id: equipmentCollection.equipmentId }).from(equipmentCollection)
            .where(and(eq(equipmentCollection.inventoryId, inventoryId), eq(equipmentCollection.equipmentId, itemId), gt(equipmentCollection.quantity, 0))).limit(1);
    return rows.length > 0;
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
        .select({
            equipment,
            rarity,
            quantity: equipmentCollection.quantity,
            stats: {
                progress: equipmentStats.progress,
                quality: equipmentStats.quality,
                yield: equipmentStats.yield,
                gatheringPoints: equipmentStats.gatheringPoints,
            },
        })
        .from(equipmentCollection)
        .innerJoin(equipment, eq(equipment.id, equipmentCollection.equipmentId))
        .innerJoin(rarity, eq(rarity.id, equipmentCollection.rarityId))
        .leftJoin(equipmentStats, and(
            eq(equipmentStats.equipmentId, equipmentCollection.equipmentId),
            eq(equipmentStats.rarityId, equipmentCollection.rarityId),
        ))
        .where(and(eq(equipmentCollection.inventoryId, inventoryId), gt(equipmentCollection.quantity, 0)))
        .orderBy(asc(equipment.name), desc(rarity.tier));
}


export async function findSellPriceInfo(itemType: "resource" | "equipment", itemId: string, rarityId: string, conn: Connection = db) {
    const item = itemType === "resource"
        ? firstOrNull(await conn.select({ vendorPrice: resources.vendorPrice }).from(resources).where(eq(resources.id, itemId)))
        : firstOrNull(await conn.select({ vendorPrice: equipment.vendorPrice }).from(equipment).where(eq(equipment.id, itemId)));
    const tier = firstOrNull(await conn.select({ tier: rarity.tier }).from(rarity).where(eq(rarity.id, rarityId)));

    return item && tier ? { vendorPrice: item.vendorPrice, tier: tier.tier } : null;
}


export async function takeFromStack(
    inventoryId: string, itemType: "resource" | "equipment", itemId: string, rarityId: string, quantity: number,
    conn: Connection = db,
) {
    const rows = itemType === "resource"
        ? await conn.update(resourceCollection)
            .set({ quantity: sql`${resourceCollection.quantity} - ${quantity}` })
            .where(and(
                eq(resourceCollection.inventoryId, inventoryId),
                eq(resourceCollection.resourceId, itemId),
                eq(resourceCollection.rarityId, rarityId),
                gte(resourceCollection.quantity, quantity),
            ))
            .returning({ remaining: resourceCollection.quantity })
        : await conn.update(equipmentCollection)
            .set({ quantity: sql`${equipmentCollection.quantity} - ${quantity}` })
            .where(and(
                eq(equipmentCollection.inventoryId, inventoryId),
                eq(equipmentCollection.equipmentId, itemId),
                eq(equipmentCollection.rarityId, rarityId),
                gte(equipmentCollection.quantity, quantity),
            ))
            .returning({ remaining: equipmentCollection.quantity });

    return firstOrNull(rows)?.remaining ?? null;
}

export async function deleteEmptyStack(inventoryId: string, itemType: "resource" | "equipment", itemId: string, rarityId: string, conn: Connection = db) {
    if (itemType === "resource") {
        await conn.delete(resourceCollection).where(and(
            eq(resourceCollection.inventoryId, inventoryId),
            eq(resourceCollection.resourceId, itemId),
            eq(resourceCollection.rarityId, rarityId),
            eq(resourceCollection.quantity, 0),
        ));
    } else {
        await conn.delete(equipmentCollection).where(and(
            eq(equipmentCollection.inventoryId, inventoryId),
            eq(equipmentCollection.equipmentId, itemId),
            eq(equipmentCollection.rarityId, rarityId),
            eq(equipmentCollection.quantity, 0),
        ));
    }
}

export async function addGold(inventoryId: string, amount: number, conn: Connection = db): Promise<number> {
    const [row] = await conn
        .update(inventory)
        .set({ gold: sql`${inventory.gold} + ${amount}` })
        .where(eq(inventory.id, inventoryId))
        .returning({ gold: inventory.gold });
    return row.gold;
}
