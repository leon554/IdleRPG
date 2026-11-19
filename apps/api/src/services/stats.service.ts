import { db } from "../db/index.js";
import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { categories, slots, equippedItem, equipmentStats } from "../db/schema.js";
import { getAuthUser, requireAuth } from "../middleware/requireAuth.js";
import type { CategoryStats } from "@idlerpg/shared";


export async function getStatsPerCategory(userId: string){
    const rows = await db
        .select({
            categoryId: categories.id,
            progress: sql<number>`${categories.baseProgress} + coalesce(sum(${equipmentStats.progress}), 0)`.mapWith(Number),
            quality: sql<number>`${categories.baseQuality} + coalesce(sum(${equipmentStats.quality}), 0)`.mapWith(Number),
            yield: sql<number>`${categories.baseYield} + coalesce(sum(${equipmentStats.yield}), 0)`.mapWith(Number),
            gatheringPoints: sql<number>`${categories.baseGatheringPoints} + coalesce(sum(${equipmentStats.gatheringPoints}), 0)`.mapWith(Number),
        })
        .from(categories)
        .leftJoin(slots, eq(slots.categoryId, categories.id))
        .leftJoin(
            equippedItem,
            and(eq(equippedItem.slotId, slots.id), eq(equippedItem.userId, userId)),
        )
        .leftJoin(
            equipmentStats,
            and(
                eq(equipmentStats.equipmentId, equippedItem.equipmentId),
                eq(equipmentStats.rarityId, equippedItem.rarityId),
            ),
        )
        .groupBy(categories.id);

    const stats: Record<string, CategoryStats> = {};
    for (const { categoryId, ...categoryStats } of rows) {
        stats[categoryId] = categoryStats;
    }

    return stats
}