import { Router } from "express";
import { and, eq, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { categories, slots, equippedItem, equipmentStats } from "../../db/schema.js";
import { getAuthUser, requireAuth } from "../../middleware/requireAuth.js";
import type { CategoryStats } from "@idlerpg/shared";
import { getStatsPerCategory } from "../../services/stats.service.js";

export const statsRouter = Router();

statsRouter.get("/stats", requireAuth, async (_req, res) => {
    const user = getAuthUser(res);
    const stats = await getStatsPerCategory(user.id)
    res.status(200).json(stats);
});
