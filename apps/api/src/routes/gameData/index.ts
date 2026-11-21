import { Router } from "express";
import { recipeRouter } from "./recipes.js";
import { gatheringGroupRouter } from "./gatheringGroups.js";
import { actionRouter } from "./actions.js";
import { statsRouter } from "./stats.js";
import { taskRouter } from "../../modules/task/task.routes.js";


export const gameDateRouter = Router()

gameDateRouter.use(recipeRouter)
gameDateRouter.use(gatheringGroupRouter)
gameDateRouter.use(actionRouter)
gameDateRouter.use(statsRouter)
gameDateRouter.use(taskRouter)