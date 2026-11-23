import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { equipSchema, unequipSchema } from "./equipment.schemas.js";
import * as equipmentService from "./equipment.service.js";

export const getEquipment: RequestHandler = async (_req, res) => {
    res.status(200).json(await equipmentService.getEquipment(getAuthUser(res).id));
};

export const equip = withBody(equipSchema, async (body, _req, res) => {
    res.status(200).json(await equipmentService.equip(getAuthUser(res).id, body));
});

export const unequip = withBody(unequipSchema, async (body, _req, res) => {
    res.status(200).json(await equipmentService.unequip(getAuthUser(res).id, body));
});
