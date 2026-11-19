import { Router, type Response } from "express";
import { db } from "../../db/index.js";
import { taskAction, taskRecipeInput } from "../../db/schema.js";
import { getAuthUser, requireAuth } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { craftTaskSchema, gatherTaskSchema } from "../../validation/schemas.js";
import type { GatheringGroup, TaskTarget } from "@idlerpg/shared";
import type { TaskRequirements } from "../../types/task.js";
import { fail } from "../../util/generalUtil/outcome.js";
import { getAvailableResources,  getGatheringRequirements,  getInventory,  getRecipeRequirements,  insertTask,  validateInputsAmtMatchRecipeRequirements,  validatePlayerMeetsRequirements,  validateTaskExistence,} from "../../services/task.service.js";

export const taskRouter = Router();

taskRouter.post(
    "/tasks/gather",
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
        const outcome = await validateTaskExistence(tx, actionIds)
        if(!outcome.ok) return outcome
       
        let taskRequirements: TaskRequirements | null = null

        if (target.type === "gather") {
            const group = await getGatheringRequirements(tx, target.gatheringGroupId);
            if(!group) return fail(404, "Could not get gathering requirements");
            taskRequirements = group
        } else {
            const recipe = await getRecipeRequirements(tx, target.recipeId)
            if (!recipe) return fail(404, "Recipe not found");
            taskRequirements = {...recipe, xpRequirement: 0}
        }

        const requirementsOutcome = await validatePlayerMeetsRequirements(tx, taskRequirements, userId)
        if(!requirementsOutcome.ok) return requirementsOutcome

        if (target.type === "craft") {
            const inputOutcome = await validateInputsAmtMatchRecipeRequirements(tx, target.recipeId, target.inputs)
            if(!inputOutcome.ok) return inputOutcome

            const requiredResources = inputOutcome.payload.required
            const rarityByResource = inputOutcome.payload.rarityByResource

            if (requiredResources.length > 0) {
                const inventoryOutcome = await getInventory(tx, userId)
                if (!inventoryOutcome.ok) return inventoryOutcome

                const userResources = await getAvailableResources(tx, requiredResources, inventoryOutcome.payload.inventory.id)
                if(!userResources.ok) return fail(233, "error")

                for (const resource of requiredResources) {
                    const rarityId = rarityByResource.get(resource.resourceId)!;
                    const have = userResources.payload.find((o) => o.resourceId === resource.resourceId && o.rarityId === rarityId)?.quantity ?? 0;
                    if (have < resource.amount * target.craftCount) {
                        return fail(400, `Not enough ${resource.resourceId} for ${target.craftCount} crafts`);
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

        return { ok: true as const, task: { ...created, actionIds, inputs } };
    });


const sendCreatedTask = async (res: Response, target: TaskTarget, actionIds: string[]) => {
    const user = getAuthUser(res);
    try {
        const result = await createTask(user.id, target, actionIds);
        if (!result.ok) return res.status(result.status).json({ error: result.message });
        return res.status(201).json(result.task);
    } catch (err) {
        const pg = (err as { cause?: { code?: string; constraint?: string } }).cause;
        if (pg?.code === "23505" && pg.constraint === "task_userId_unique") {
            return res.status(409).json({ error: "You already have an active task" });
        }
        throw err; 
    }
};
