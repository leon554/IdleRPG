import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import * as inventoryService from "./inventory.service.js";

export const getInventory: RequestHandler = async (_req, res) => {
    res.status(200).json(await inventoryService.getInventory(getAuthUser(res).id));
};
