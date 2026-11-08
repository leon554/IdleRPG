import { Router } from "express";
import { recipeRouter } from "./recipes.js";
import { gatheringGroupRouter } from "./gatheringGroups.js";


export const gameDateRouter = Router()

gameDateRouter.use(recipeRouter)
gameDateRouter.use(gatheringGroupRouter)