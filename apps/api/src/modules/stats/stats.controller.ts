import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import * as statsService from "./stats.service.js";

export const getStats: RequestHandler = async (_req, res) => {
    res.status(200).json(await statsService.getStatsPerCategory(getAuthUser(res).id));
};
