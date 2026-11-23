import { type RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import * as progressService from "./progress.service.js"

export const getAllProgress: RequestHandler = async (_req, res) => {
    const user = getAuthUser(res);
    const progress = await progressService.getAllCategoryProgress(user.id);
    res.status(200).json(progress);
};

