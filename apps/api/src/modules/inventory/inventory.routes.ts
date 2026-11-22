import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as inventoryController from "./inventory.controller.js";

export const inventoryRouter = Router();

inventoryRouter.get("/inventory", requireAuth, inventoryController.getInventory);
