import type { ActiveTask, GatherActiveTask, TaskTarget } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import type { Connection } from "../../types/db.js";
import { isUniqueViolation } from "../../errorHandler.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors.js";
import { getStatsPerCategory } from "../../services/stats.service.js";
import * as taskRepo from "./task.repository.js";
import type { CraftTarget, RequiredResource, TaskRequirements } from "./task.types.js";

export async function createTask(userId: string, target: TaskTarget, actionIds: string[]) {
    try {
        return await db.transaction(async (tx) => {
            await assertActionsExist(actionIds, tx);

            const requirements = await findTaskRequirements(target, tx);
            await assertPlayerMeetsRequirements(userId, requirements, tx);

            if (target.type === "craft") await assertCanAffordCraft(userId, target, tx);

            const created = await taskRepo.insertTask(userId, target, tx);
            await taskRepo.insertTaskActions(created.id, actionIds, tx);

            const inputs = target.type === "craft" ? target.inputs : [];
            await taskRepo.insertTaskRecipeInputs(created.id, inputs, tx);

            return { ...created, actionIds, inputs };
        });
    } catch (err) {
        if (isUniqueViolation(err, "task_userId_unique")) throw conflict("task_already_active");
        throw err;
    }
}

export async function getActiveTask(userId: string): Promise<ActiveTask> {
    const activeTask = await taskRepo.findTaskByUser(userId);
    if (!activeTask) throw notFound("no_active_task");

    const { gatheringGroupId, recipeId, ...rest } = activeTask;
    const base = { ...rest, actions: await taskRepo.findTaskActions(activeTask.id) };

    if (recipeId !== null) {
        const [recipe, requiredResources, inputs] = await Promise.all([
            taskRepo.findRecipe(recipeId),
            taskRepo.findRequiredResourcesWithNames(recipeId),
            taskRepo.findTaskRecipeInputs(activeTask.id),
        ]);
        if (!recipe) throw notFound("recipe_not_found");

        return { taskType: "crafting", ...base, gatheringGroupId: null, recipeId, recipe, requiredResources, inputs };
    }

    return { taskType: "gathering", ...base, gatheringGroupId: gatheringGroupId!, recipeId: null };
}


export async function claimResources(userId: string, task: GatherActiveTask) {
    const [group, secondaryResources] = await Promise.all([
        taskRepo.findGatheringGroupWithMainResource(task.gatheringGroupId),
        taskRepo.findGatheringGroupSecondaryResources(task.gatheringGroupId),
    ]);

    const statsPerCategory = await getStatsPerCategory(userId)
    const categoryStats = statsPerCategory[group?.mainResource?.categoryId ?? ""]

    const stats = {progress: 0, qaulity: 0, yield: 0}

    task.actions.forEach(a => {
        stats.progress += a.progressMultiplier * categoryStats.progress
        stats.qaulity += a.qualityMultiplier * categoryStats.quality
        stats.yield += a.yieldMultiplier * categoryStats.yield
    })

    //calculate odds then do the claims

    if (!group) return null;
    return { ...group, secondaryResources };
}



async function assertActionsExist(actionIds: string[], conn: Connection) {
    const found = await taskRepo.findExistingActionIds(actionIds, conn);
    if (found.length !== new Set(actionIds).size) throw badRequest("action_not_found");
}

async function findTaskRequirements(target: TaskTarget, conn: Connection): Promise<TaskRequirements> {
    if (target.type === "gather") {
        const group = await taskRepo.findGatheringGroupRequirements(target.gatheringGroupId, conn);
        if (!group) throw notFound("gathering_group_not_found");
        return group;
    }

    const recipe = await taskRepo.findRecipeRequirements(target.recipeId, conn);
    if (!recipe) throw notFound("recipe_not_found");
    return { ...recipe, xpRequirement: 0 };
}

async function assertPlayerMeetsRequirements(userId: string, requirements: TaskRequirements, conn: Connection) {
    const progress = await taskRepo.findPlayerCategoryProgress(userId, requirements.categoryId, conn);
    const level = progress?.level ?? 0; 
    const xp = progress?.xp ?? 0;

    if (level < requirements.levelRequirement || xp < requirements.xpRequirement) {
        throw forbidden("requirements_not_met");
    }
}


function assertValidRecipeInputs(required: RequiredResource[], target: CraftTarget): Map<string, string> {
    const rarityByResource = new Map(target.inputs.map((i) => [i.resourceId, i.rarityId]));

    const inputsMatch =
        rarityByResource.size === target.inputs.length &&
        rarityByResource.size === required.length &&
        required.every((r) => rarityByResource.has(r.resourceId));

    if (!inputsMatch) throw badRequest("invalid_recipe_inputs");
    return rarityByResource;
}

async function assertCanAffordCraft(userId: string, target: CraftTarget, conn: Connection) {
    const required = await taskRepo.findRequiredResourcesForRecipe(target.recipeId, conn);
    const rarityByResource = assertValidRecipeInputs(required, target);
    if (required.length === 0) return;

    const inventoryId = await taskRepo.findUserInventoryId(userId, conn);
    if (!inventoryId) throw notFound("inventory_not_found");

    const owned = await taskRepo.findOwnedResources(inventoryId, required.map((r) => r.resourceId), conn);

    for (const resource of required) {
        const rarityId = rarityByResource.get(resource.resourceId)!;
        const have = owned.find((o) => o.resourceId === resource.resourceId && o.rarityId === rarityId)?.quantity ?? 0;
        const needed = resource.amount * target.craftCount;

        if (have < needed) {
            throw badRequest("not_enough_resources", { resourceId: resource.resourceId, rarityId, have, needed });
        }
    }
}
