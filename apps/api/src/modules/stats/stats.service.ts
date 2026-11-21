import type { CategoryStats } from "@idlerpg/shared";
import * as statsRepo from "./stats.repository.js";

export async function getStatsPerCategory(userId: string): Promise<Record<string, CategoryStats>> {
    const rows = await statsRepo.findCategoryStatRows(userId);

    const stats: Record<string, CategoryStats> = {};
    for (const { categoryId, ...categoryStats } of rows) {
        stats[categoryId] = categoryStats;
    }
    return stats
}
