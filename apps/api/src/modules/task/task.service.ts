import type { Action, ActiveTask, CategoryStats, ClaimedItem, ClaimResult, Rarity, Resource, TaskActionEntry, TaskTarget } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import type { Connection } from "../../types/db.js";
import { isUniqueViolation } from "../../errorHandler.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors.js";
import { getStatsPerCategory } from "../stats/stats.service.js";
import * as inventoryService from "../inventory/inventory.service.js";
import * as progressService from "../progress/progress.service.js";
import { applyRarityMultiplier, getItemRarity } from "../../util/gameUtil/random.js";
import * as taskRepo from "./task.repository.js";
import { TASK_DELAY } from "./task.constants.js";
import type { CraftTarget, RequiredResource, TaskRequirements } from "./task.types.js";

type RotationAction = Pick<Action, "progressMultiplier" | "qualityMultiplier" | "yieldMultiplier" | "gatheringPointCost">;

export async function createTask(userId: string, target: TaskTarget, actionIds: string[]) {
    try {
        return await db.transaction(async (tx) => {
            const current = await taskRepo.findTaskByUserForUpdate(userId, tx);
            const claim = current?.gatheringGroupId ? await claimLockedTask(userId, current, tx) : null;

            const rotation = await loadRotation(actionIds, tx);

            const requirements = await findTaskRequirements(target, tx);
            await assertPlayerMeetsRequirements(userId, requirements, tx);

            if (target.type === "gather") await assertRotationIsValid(userId, target.gatheringGroupId, rotation, tx);

            if (target.type === "craft") await assertCanAffordCraft(userId, target, tx);

            if (current) await taskRepo.deleteTaskByUser(userId, tx);

            const created = await taskRepo.insertTask(userId, target, tx);
            await taskRepo.insertTaskActions(created.id, actionIds, tx);

            const inputs = target.type === "craft" ? target.inputs : [];
            await taskRepo.insertTaskRecipeInputs(created.id, inputs, tx);

            return { ...created, actionIds, inputs, claim };
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


export async function claimTask(userId: string): Promise<ClaimResult> {
    return db.transaction(async (tx) => {
        const task = await taskRepo.findTaskByUserForUpdate(userId, tx);
        if (!task) throw notFound("no_active_task");
        return claimLockedTask(userId, task, tx);
    });
}

type LockedTask = NonNullable<Awaited<ReturnType<typeof taskRepo.findTaskByUserForUpdate>>>;
async function claimLockedTask(userId: string, task: LockedTask, tx: Connection): Promise<ClaimResult> {
    if (task.gatheringGroupId === null) throw badRequest("crafting_claim_not_supported");

    await inventoryService.getOrCreateInventoryId(userId, tx);

    const cycleMs = TASK_DELAY * 1000;
    const cycles = Math.floor((Date.now() - task.lastClaimedAt.getTime()) / cycleMs);
    const claimedUntil = new Date(task.lastClaimedAt.getTime() + cycles * cycleMs);
    const nextCycleAt = new Date(claimedUntil.getTime() + cycleMs);

    if (cycles === 0) return { cyclesClaimed: 0, successfulCycles: 0, items: [], nextCycleAt };

    const group = await taskRepo.findGatheringGroupWithMainResource(task.gatheringGroupId, tx);
    const secondaryResources = await taskRepo.findGatheringGroupSecondaryResources(task.gatheringGroupId, tx);
    const actions = await taskRepo.findTaskActions(task.id, tx);
    const rarities = await taskRepo.findAllRarities(tx);
    const statsPerCategory = await getStatsPerCategory(userId);

    if (!group?.mainResource) throw notFound("gathering_group_not_found");

    const mainResource = group.mainResource;
    const rotation = calculateRotation(actions, statsPerCategory[mainResource.categoryId]);
    const succeeded = rotation.progress >= mainResource.progressRequirement;
    const successfulCycles = succeeded ? cycles : 0;

    
    const qualityRatio = mainResource.qualityRequirement > 0 ? rotation.quality / mainResource.qualityRequirement : 0;
    const boostedRarities = Object.values(
        applyRarityMultiplier(Object.fromEntries(rarities.map((r) => [r.id, r])), qualityRatio),
    );

    const amountPerCycle = mainAmountPerCycle(rotation.yield, mainResource.yieldRequirement);

    const loot = new LootTally();
    for (let i = 0; i < successfulCycles; i++) {
        loot.add(mainResource, getItemRarity(boostedRarities).id, amountPerCycle);

        for (const secondary of secondaryResources) {
            if (Math.random() < secondary.dropChance) {
                loot.add(secondary.resource, getItemRarity(boostedRarities).id, 1);
            }
        }
    }

    await inventoryService.addResources(userId, loot.stacks(), tx);
    await taskRepo.updateTaskAfterClaim(task.id, claimedUntil, task.completedCount + successfulCycles, tx);

    const rarityById = new Map(rarities.map((r) => [r.id, r]));
    const items: ClaimedItem[] = loot.entries().map(({ resource, rarityId, amount }) => ({
        type: "resource",
        resource,
        rarity: rarityById.get(rarityId)!,
        amount,
    }));

    return { cyclesClaimed: cycles, successfulCycles, items, nextCycleAt };
}

export async function stopTask(userId: string): Promise<ClaimResult | null> {
    return db.transaction(async (tx) => {
        const task = await taskRepo.findTaskByUserForUpdate(userId, tx);
        if (!task) throw notFound("no_active_task");

        const claim = task.gatheringGroupId ? await claimLockedTask(userId, task, tx) : null;

        await taskRepo.deleteTaskByUser(userId, tx);
        return claim;
    });
}

async function loadRotation(actionIds: string[], conn: Connection): Promise<Action[]> {
    const found = await taskRepo.findActionsByIds(actionIds, conn);
    const byId = new Map(found.map((a) => [a.id, a]));
    if (byId.size !== new Set(actionIds).size) throw badRequest("action_not_found");
    return actionIds.map((id) => byId.get(id)!);
}


async function assertRotationIsValid(userId: string, gatheringGroupId: string, rotation: Action[], conn: Connection) {
    const group = await taskRepo.findGatheringGroupWithMainResource(gatheringGroupId, conn);
    if (!group?.mainResource) throw notFound("gathering_group_not_found");

    const stats = (await getStatsPerCategory(userId))[group.mainResource.categoryId];
    const totals = calculateRotation(rotation, stats);

    if (totals.gpUsed > (stats?.gatheringPoints ?? 0)) throw badRequest("not_enough_gp_for_rotation");
    if (totals.progress < group.mainResource.progressRequirement) throw badRequest("not_enough_progress_for_task");
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
    const { level, xp } = await progressService.getCategoryProgress(userId, requirements.categoryId, conn);

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

    const owned = await inventoryService.getOwnedResources(userId, required.map((r) => r.resourceId), conn);

    for (const resource of required) {
        const rarityId = rarityByResource.get(resource.resourceId)!;
        const have = owned.find((o) => o.resourceId === resource.resourceId && o.rarityId === rarityId)?.quantity ?? 0;
        const needed = resource.amount * target.craftCount;

        if (have < needed) {
            throw badRequest("not_enough_resources", { resourceId: resource.resourceId, rarityId, have, needed });
        }
    }
}

function calculateRotation(actions: RotationAction[], stats: CategoryStats | undefined) {
    const total = { progress: 0, quality: 0, yield: 0, gpUsed: 0 };
    if (!stats) return total;

    for (const action of actions) {
        total.progress += action.progressMultiplier * stats.progress;
        total.quality += action.qualityMultiplier * stats.quality;
        total.yield += action.yieldMultiplier * stats.yield;
        total.gpUsed += action.gatheringPointCost;
    }
    return total;
}


function mainAmountPerCycle(rotationYield: number, yieldRequirement: number) {
    if (yieldRequirement <= 0) return 1;
    return Math.max(1, Math.floor(rotationYield / yieldRequirement / 0.25));
}


class LootTally {
    private readonly byKey = new Map<string, { resource: Resource; rarityId: string; amount: number }>();

    add(resource: Resource, rarityId: string, amount: number) {
        const key = `${resource.id}:${rarityId}`;
        const entry = this.byKey.get(key);
        if (entry) entry.amount += amount;
        else this.byKey.set(key, { resource, rarityId, amount });
    }

    entries() {
        return [...this.byKey.values()];
    }

    stacks() {
        return this.entries().map(({ resource, rarityId, amount }) => ({ resourceId: resource.id, rarityId, amount }));
    }
}
