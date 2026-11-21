import { Router, type Response } from "express";
import { db } from "../../db/index.js";
import { taskAction, taskRecipeInput } from "../../db/schema.js";
import { getAuthUser, requireAuth } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { craftTaskSchema, gatherTaskSchema } from "../../validation/schemas.js";
import type { GatheringGroup, TaskTarget } from "@idlerpg/shared";
import type { TaskRequirements } from "../../types/task.js";
import { badRequest, conflict, notFound } from "../../shared/errors.js";
import { isUniqueViolation } from "../../errorHandler.js";
import { getAvailableResources,  getGatheringRequirements,  getInventory,  getRecipeRequirements,  insertTask,  validateInputsAmtMatchRecipeRequirements,  validatePlayerMeetsRequirements,  validateTaskExistence,} from "../../services/task.service.js";

export const taskRouter = Router();

taskRouter.post(
    "/tasks/gather", requireAuth,
    withBody(gatherTaskSchema, (body, _req, res) =>
        sendCreatedTask(res, { type: "gather", gatheringGroupId: body.gatheringGroupId }, body.actionIds),
    ),
);

taskRouter.post(
    "/tasks/craft", requireAuth,
    withBody(craftTaskSchema, (body, _req, res) =>
        sendCreatedTask(
            res,
            { type: "craft", recipeId: body.recipeId, craftCount: body.craftCount, inputs: body.inputs ?? [] },
            body.actionIds,
        ),
    ),
);

const createTask = (userId: string, target: TaskTarget, actionIds: string[]) =>
    db.transaction(async (tx) => {
        await validateTaskExistence(tx, actionIds)

        let taskRequirements: TaskRequirements

        if (target.type === "gather") {
            const group = await getGatheringRequirements(tx, target.gatheringGroupId);
            if (!group) throw notFound("gathering_group_not_found");
            taskRequirements = group
        } else {
            const recipe = await getRecipeRequirements(tx, target.recipeId)
            if (!recipe) throw notFound("recipe_not_found");
            taskRequirements = {...recipe, xpRequirement: 0}
        }

        await validatePlayerMeetsRequirements(tx, taskRequirements, userId)

        if (target.type === "craft") {
            const { required: requiredResources, rarityByResource } =
                await validateInputsAmtMatchRecipeRequirements(tx, target.recipeId, target.inputs)

            if (requiredResources.length > 0) {
                const userInventory = await getInventory(tx, userId)
                const userResources = await getAvailableResources(tx, requiredResources, userInventory.id)

                for (const resource of requiredResources) {
                    const rarityId = rarityByResource.get(resource.resourceId)!;
                    const have = userResources.find((o) => o.resourceId === resource.resourceId && o.rarityId === rarityId)?.quantity ?? 0;
                    const needed = resource.amount * target.craftCount;
                    if (have < needed) {
                        throw badRequest("not_enough_resources", { resourceId: resource.resourceId, rarityId, have, needed });
                    }
                }
            }
        }

       const created = await insertTask(tx, userId, target)

        await tx.insert(taskAction).values(
            actionIds.map((actionId, position) => ({ taskId: created.id, actionId, position })),
        );

        const inputs = target.type === "craft" ? target.inputs : [];
        if (inputs.length > 0) {
            await tx.insert(taskRecipeInput).values(inputs.map((input) => ({ taskId: created.id, ...input })));
        }

        return { ...created, actionIds, inputs };
    });


const sendCreatedTask = async (res: Response, target: TaskTarget, actionIds: string[]) => {
    const user = getAuthUser(res);
    try {
        const createdTask = await createTask(user.id, target, actionIds);
        return res.status(201).json(createdTask);
    } catch (err) {
        // task_userId_unique: the player already has a task (also covers two requests racing)
        if (isUniqueViolation(err, "task_userId_unique")) throw conflict("task_already_active");
        throw err; // HttpErrors and real failures both go to errorHandler
    }
};
