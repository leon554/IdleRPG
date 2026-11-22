import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { sellSchema } from "./inventory.schemas.js";
import * as inventoryService from "./inventory.service.js";

export const getInventory: RequestHandler = async (_req, res) => {
    res.status(200).json(await inventoryService.getInventory(getAuthUser(res).id));
};

export const sellStack = withBody(sellSchema, async (body, _req, res) => {
    res.status(200).json(await inventoryService.sellStack(getAuthUser(res).id, body));
});
