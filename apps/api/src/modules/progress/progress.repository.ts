import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { categoryLevel } from "../../db/schema.js";
import type { Connection } from "../../types/db.js";

export async function findCategoryProgress(userId: string, categoryId: string, conn: Connection = db) {
    const rows = await conn
        .select({ level: categoryLevel.level, xp: categoryLevel.xp, categoryId: categoryLevel.categoryId })
        .from(categoryLevel)
        .where(and(eq(categoryLevel.userId, userId), eq(categoryLevel.categoryId, categoryId)));

    return firstOrNull(rows)
}

export async function findAllCategoryProgress(userId: string, conn: Connection = db) {
    const rows = await conn
        .select({ level: categoryLevel.level, xp: categoryLevel.xp, categoryId: categoryLevel.categoryId })
        .from(categoryLevel)
        .where(eq(categoryLevel.userId, userId));

    return rows
}

export async function addCategoryXp(userId: string, categoryId: string, xpAmount: number, conn: Connection = db) {
    const [row] = await conn
        .insert(categoryLevel)
        .values({ userId, categoryId, xp: xpAmount })
        .onConflictDoUpdate({
            target: [categoryLevel.userId, categoryLevel.categoryId],
            set: { xp: sql`${categoryLevel.xp} + excluded.xp` },
        })
        .returning({ level: categoryLevel.level, xp: categoryLevel.xp });
    return row;
}

export async function updateCategoryLevel(userId: string, categoryId: string, level: number, conn: Connection = db) {
    await conn
        .update(categoryLevel)
        .set({ level })
        .where(and(eq(categoryLevel.userId, userId), eq(categoryLevel.categoryId, categoryId)));
}
