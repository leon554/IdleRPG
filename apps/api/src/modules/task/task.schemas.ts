import type { Schema } from "../../validation/validate.js";
import { arrayOf, int, object, optional, str } from "../../validation/typeValidation.js";

export const MAX_TASK_ACTIONS = 20;

export const gatherTaskSchema = {
    gatheringGroupId: str(),
    actionIds: arrayOf(str(), 1, MAX_TASK_ACTIONS),
} satisfies Schema;

export const craftTaskSchema = {
    recipeId: str(),
    craftCount: int(1, Infinity),
    actionIds: arrayOf(str(), 1, MAX_TASK_ACTIONS),
    inputs: optional(arrayOf(object({ resourceId: str(), rarityId: str() }), 0, 50)),
} satisfies Schema;
