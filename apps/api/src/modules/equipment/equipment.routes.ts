import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as equipmentController from "./equipment.controller.js";

export const equipmentRouter = Router();

equipmentRouter.get("/equipment", requireAuth, equipmentController.getEquipment);
equipmentRouter.post("/equipment/equip", requireAuth, equipmentController.equip);
equipmentRouter.post("/equipment/unequip", requireAuth, equipmentController.unequip);
