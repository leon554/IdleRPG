import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { twoAttempsASecondPerIpLimiter } from "../../middleware/rateLimits.js";
import * as catalogController from "./catalog.controller.js";

export const catalogRouter = Router();

catalogRouter.get("/recipes", twoAttempsASecondPerIpLimiter, requireAuth, catalogController.getRecipes);
catalogRouter.get("/gathering-groups", twoAttempsASecondPerIpLimiter, requireAuth, catalogController.getGatheringGroups);
catalogRouter.get("/actions", catalogController.getActions);
