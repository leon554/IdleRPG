import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import * as taskController from "./task.controller.js";

export const taskRouter = Router();

taskRouter.post("/tasks/gather", requireAuth, taskController.createGatherTask);
taskRouter.post("/tasks/craft", requireAuth, taskController.createCraftTask);
taskRouter.get("/tasks/active-task", requireAuth, taskController.getActiveTask);
taskRouter.post("/tasks/claim", requireAuth, taskController.claimTask);
taskRouter.post("/tasks/stop-task", requireAuth, taskController.stopTask);
