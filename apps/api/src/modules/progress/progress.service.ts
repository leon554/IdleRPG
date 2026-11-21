import { db } from "../../db/index.js";
import type { Connection } from "../../types/db.js";
import * as progressRepo from "./progress.repository.js";

export async function getCategoryProgress(userId: string, categoryId: string, conn: Connection = db) {
    const progress = await progressRepo.findCategoryProgress(userId, categoryId, conn);
    return { level: progress?.level ?? 0, xp: progress?.xp ?? 0 };
}
