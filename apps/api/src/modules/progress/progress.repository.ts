import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { categoryLevel } from "../../db/schema.js";
import type { Connection } from "../../types/db.js";

export async function findCategoryProgress(userId: string, categoryId: string, conn: Connection = db) {
    const rows = await conn
        .select({ level: categoryLevel.level, xp: categoryLevel.xp })
        .from(categoryLevel)
        .where(and(eq(categoryLevel.userId, userId), eq(categoryLevel.categoryId, categoryId)));

    return firstOrNull(rows)
}
