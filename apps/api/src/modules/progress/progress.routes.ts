import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as progressController from "./progress.controller.js"

export const progressRouter = Router();

progressRouter.get("/progress", requireAuth, progressController.getAllProgress);