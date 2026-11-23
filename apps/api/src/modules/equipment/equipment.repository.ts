import { and, asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { equipment, equipmentStats, equippedItem, rarity, slots } from "../../db/schema.js";
import type { Connection } from "../../types/db.js";

const slotColumns = { id: slots.id, name: slots.name, categoryId: slots.categoryId, equipmentTypeId: slots.equipmentTypeId };
const statColumns = {
    progress: equipmentStats.progress,
    quality: equipmentStats.quality,
    yield: equipmentStats.yield,
    gatheringPoints: equipmentStats.gatheringPoints,
};

export async function findSlot(slotId: string, conn: Connection = db) {
    const rows = await conn.select(slotColumns).from(slots).where(eq(slots.id, slotId));
    return firstOrNull(rows);
}

export async function findSlotsWithEquipped(userId: string, conn: Connection = db) {
    return conn
        .select({ slot: slotColumns, equipment, rarity, stats: statColumns })
        .from(slots)
        .leftJoin(equippedItem, and(eq(equippedItem.slotId, slots.id), eq(equippedItem.userId, userId)))
        .leftJoin(equipment, eq(equipment.id, equippedItem.equipmentId))
        .leftJoin(rarity, eq(rarity.id, equippedItem.rarityId))
        .leftJoin(equipmentStats, and(
            eq(equipmentStats.equipmentId, equippedItem.equipmentId),
            eq(equipmentStats.rarityId, equippedItem.rarityId),
        ))
        .orderBy(asc(slots.categoryId), asc(slots.sortOrder));
}

export async function findEquipmentAtRarity(equipmentId: string, rarityId: string, conn: Connection = db) {
    const rows = await conn
        .select({ equipment, statsRarityId: equipmentStats.rarityId })
        .from(equipment)
        .leftJoin(equipmentStats, and(eq(equipmentStats.equipmentId, equipment.id), eq(equipmentStats.rarityId, rarityId)))
        .where(eq(equipment.id, equipmentId));
    const row = firstOrNull(rows);
    return row ? { equipment: row.equipment, hasStats: row.statsRarityId !== null } : null;
}

export async function findEquippedForUpdate(userId: string, slotId: string, conn: Connection = db) {
    const rows = await conn
        .select({ equipmentId: equippedItem.equipmentId, rarityId: equippedItem.rarityId })
        .from(equippedItem)
        .where(and(eq(equippedItem.userId, userId), eq(equippedItem.slotId, slotId)))
        .for("update");
    return firstOrNull(rows);
}

export async function upsertEquipped(userId: string, slotId: string, equipmentId: string, rarityId: string, conn: Connection = db) {
    await conn
        .insert(equippedItem)
        .values({ userId, slotId, equipmentId, rarityId })
        .onConflictDoUpdate({ target: [equippedItem.userId, equippedItem.slotId], set: { equipmentId, rarityId } });
}

export async function deleteEquipped(userId: string, slotId: string, conn: Connection = db) {
    const rows = await conn
        .delete(equippedItem)
        .where(and(eq(equippedItem.userId, userId), eq(equippedItem.slotId, slotId)))
        .returning({ equipmentId: equippedItem.equipmentId, rarityId: equippedItem.rarityId });
    return firstOrNull(rows);
}
