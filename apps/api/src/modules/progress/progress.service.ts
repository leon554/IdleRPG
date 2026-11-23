import { levelForXp } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import type { Connection } from "../../types/db.js";
import * as progressRepo from "./progress.repository.js";
import type { CategoryProgress } from "@idlerpg/shared";

export async function getCategoryProgress(userId: string, categoryId: string, conn: Connection = db): Promise<CategoryProgress> {
    const progress = await progressRepo.findCategoryProgress(userId, categoryId, conn);
    // No row yet = never gained XP here: level 1, the same as a new row's default
    return { level: progress?.level ?? levelForXp(0), xp: progress?.xp ?? 0, categoryId: progress?.categoryId ?? "" };
}

export async function getAllCategoryProgress(userId: string, conn: Connection = db): Promise<CategoryProgress[]> {
    const progress = await progressRepo.findAllCategoryProgress(userId, conn);
    return progress
}
export async function addXp(userId: string, categoryId: string, xpAmount: number, conn: Connection = db): Promise<CategoryProgress | null> {
    if (xpAmount <= 0) return null;

    const updated = await progressRepo.addCategoryXp(userId, categoryId, xpAmount, conn);
    const level = levelForXp(updated.xp);
    if (level !== updated.level) await progressRepo.updateCategoryLevel(userId, categoryId, level, conn);

    return { level, xp: updated.xp, categoryId };
}
