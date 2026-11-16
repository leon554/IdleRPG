import { Router } from "express";
import { recipeRouter } from "./recipes.js";
import { gatheringGroupRouter } from "./gatheringGroups.js";
import { actionRouter } from "./actions.js";
import { statsRouter } from "./stats.js";


export const gameDateRouter = Router()

gameDateRouter.use(recipeRouter)
gameDateRouter.use(gatheringGroupRouter)
gameDateRouter.use(actionRouter)
gameDateRouter.use(statsRouter)