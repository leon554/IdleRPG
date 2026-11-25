import { calculateXp, craftRarityMultiplier, type Action, type ActiveTask, type CategoryStats, type ClaimedItem, type ClaimResult, type Rarity, type Resource, type TaskActionEntry, type TaskTarget } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import { lockUser } from "../../db/helpers.js";
import type { Connection } from "../../types/db.js";
import { isUniqueViolation } from "../../errorHandler.js";
import { badRequest, conflict, forbidden, notFound } from "../../shared/errors.js";
import { getStatsPerCategory } from "../stats/stats.service.js";
import * as inventoryService from "../inventory/inventory.service.js";
import * as progressService from "../progress/progress.service.js";
import { applyRarityMultiplier, getItemRarity } from "../../util/gameUtil/random.js";
import * as taskRepo from "./task.repository.js";
import { TASK_BASE_CYCLE_SECONDS } from "./task.constants.js";
import type { CraftTarget, RequiredResource, TaskRequirements } from "./task.types.js";

type RotationAction = Pick<Action, "progressMultiplier" | "qualityMultiplier" | "yieldMultiplier" | "gatheringPointCost">;

export async function createTask(userId: string, target: TaskTarget, actionIds: string[]) {
    let outcome;
    try {
        outcome = await db.transaction(async (tx) => {
            // Same per-user lock as equipping, so gear can't change in a category while a task there is being started
            await lockUser(userId, tx);
            const current = await taskRepo.findTaskByUserForUpdate(userId, tx);
            // Paying out the running task may overflow; if it does, the claim also stops that task
            const claim = current ? await claimLockedTask(userId, current, tx) : null;

            // A new task can't start with a full inventory. Returned (not thrown) so the payout above still commits.
            const space = await inventoryService.getSpace(userId, tx);
            if (space.used >= space.max) return { refused: { ...space, claim } };

            const rotation = await loadRotation(actionIds, tx);

            const requirements = await findTaskRequirements(target, tx);
            await assertPlayerMeetsRequirements(userId, requirements, tx);

            await assertRotationIsValid(userId, await findRotationTarget(target, tx), rotation, tx);

            if (target.type === "craft") await assertCanAffordCraft(userId, target, tx);

            if (current) await taskRepo.deleteTaskByUser(userId, tx);

            const created = await taskRepo.insertTask(userId, target, cycleLengthMs(rotation), tx);
            await taskRepo.insertTaskActions(created.id, actionIds, tx);

            const inputs = target.type === "craft" ? target.inputs : [];
            await taskRepo.insertTaskRecipeInputs(created.id, inputs, tx);

            return { created: { ...created, actionIds, inputs, claim } };
        });
    } catch (err) {
        if (isUniqueViolation(err, "task_userId_unique")) throw conflict("task_already_active");
        throw err;
    }

    // After the commit: the running task's payout (and its stop, if it overflowed) is kept
    if ("refused" in outcome) throw conflict("inventory_full", outcome.refused);
    return outcome.created;
}

export async function getActiveTask(userId: string): Promise<ActiveTask> {
    const activeTask = await taskRepo.findTaskByUser(userId);
    if (!activeTask) throw notFound("no_active_task");

    const { gatheringGroupId, recipeId, ...rest } = activeTask;
    const categoryId = await taskRepo.findTaskCategoryId(userId);
    if (!categoryId) throw notFound(recipeId !== null ? "recipe_not_found" : "gathering_group_not_found");
    const base = { ...rest, categoryId, actions: await taskRepo.findTaskActions(activeTask.id) };

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


// The category of the user's running task, or null when there's none (its gear slots are locked while it runs)
export async function getActiveTaskCategoryId(userId: string, conn: Connection = db): Promise<string | null> {
    return taskRepo.findTaskCategoryId(userId, conn);
}

export async function claimTask(userId: string): Promise<ClaimResult> {
    return db.transaction(async (tx) => {
        const task = await taskRepo.findTaskByUserForUpdate(userId, tx);
        if (!task) throw notFound("no_active_task");
        return claimLockedTask(userId, task, tx);
    });
}

type LockedTask = NonNullable<Awaited<ReturnType<typeof taskRepo.findTaskByUserForUpdate>>>;

type Payout = Omit<ClaimResult, "overCapacity">;

async function claimLockedTask(userId: string, task: LockedTask, tx: Connection): Promise<ClaimResult> {
    const payout = task.gatheringGroupId !== null
        ? await claimGatherTask(userId, task, task.gatheringGroupId, tx)
        : await claimCraftTask(userId, task, tx);

    // A claim always pays out in full, even past capacity. But an inventory over capacity stops the task,
    // and no new task can start until space is freed (see createTask).
    const { used, max } = await inventoryService.getSpace(userId, tx);
    if (used > max) {
        if (!payout.taskEnded) await taskRepo.deleteTaskByUser(userId, tx);
        return { ...payout, taskEnded: true, overCapacity: true };
    }
    return { ...payout, overCapacity: false };
}

function countCycles(lastClaimedAt: Date, cycleMs: number) {
    const cycles = Math.floor((Date.now() - lastClaimedAt.getTime()) / cycleMs);
    const claimedUntil = new Date(lastClaimedAt.getTime() + cycles * cycleMs);
    const nextCycleAt = new Date(claimedUntil.getTime() + cycleMs);
    return { cycles, claimedUntil, nextCycleAt };
}

async function claimGatherTask(userId: string, task: LockedTask, gatheringGroupId: string, tx: Connection): Promise<Payout> {
    await inventoryService.getOrCreateInventoryId(userId, tx);

    const { cycles, claimedUntil, nextCycleAt } = countCycles(task.lastClaimedAt, task.cycleMs);
    if (cycles === 0) return { cyclesClaimed: 0, successfulCycles: 0, items: [], nextCycleAt, taskEnded: false, xp: 0 };

    const group = await taskRepo.findGatheringGroupWithMainResource(gatheringGroupId, tx);
    const secondaryResources = await taskRepo.findGatheringGroupSecondaryResources(gatheringGroupId, tx);
    const actions = await taskRepo.findTaskActions(task.id, tx);
    const rarities = await taskRepo.findAllRarities(tx);
    const statsPerCategory = await getStatsPerCategory(userId);

    if (!group?.mainResource) throw notFound("gathering_group_not_found");

    const mainResource = group.mainResource;
    const xpRate = await taskRepo.findCategoryXpRate(mainResource.categoryId, tx);
    const rotation = calculateRotation(actions, statsPerCategory[mainResource.categoryId]);
    const succeeded = rotation.progress >= mainResource.progressRequirement;
    const successfulCycles = succeeded ? cycles : 0;

    const qualityRatio = mainResource.qualityRequirement > 0 ? rotation.quality / mainResource.qualityRequirement : 0;
    const boostedRarities = Object.values(
        applyRarityMultiplier(Object.fromEntries(rarities.map((r) => [r.id, r])), qualityRatio),
    );

    const amountPerCycle = mainAmountPerCycle(rotation.yield, mainResource.yieldRequirement);

    const loot = new LootTally();
    // XP is per successful cycle, from the main resource's tier and rolled rarity (yield and secondary drops don't add XP)
    let xpEarned = 0;
    for (let i = 0; i < successfulCycles; i++) {
        const mainRarity = getItemRarity(boostedRarities);
        loot.add(mainResource, mainRarity, amountPerCycle);
        xpEarned += calculateXp(xpRate, mainResource.tier, mainRarity.tier);

        for (const secondary of secondaryResources) {
            if (Math.random() < secondary.dropChance) {
                loot.add(secondary.resource, getItemRarity(boostedRarities), 1);
            }
        }
    }

    await inventoryService.addResources(userId, loot.stacks(), tx);
    await taskRepo.updateTaskAfterClaim(task.id, claimedUntil, task.completedCount + successfulCycles, tx);
    await progressService.addXp(userId, mainResource.categoryId, xpEarned, tx);

    const rarityById = new Map(rarities.map((r) => [r.id, r]));
    const items: ClaimedItem[] = loot.entries().map(({ resource, rarity, amount }) => ({
        type: "resource",
        resource,
        rarity: rarityById.get(rarity.id)!,
        amount,
    }));

    return { cyclesClaimed: cycles, successfulCycles, items, nextCycleAt, taskEnded: false, xp: xpEarned };
}

async function claimCraftTask(userId: string, task: LockedTask, tx: Connection): Promise<Payout> {
    const { cycles, claimedUntil, nextCycleAt } = countCycles(task.lastClaimedAt, task.cycleMs);
    if (cycles === 0) return { cyclesClaimed: 0, successfulCycles: 0, items: [], nextCycleAt, taskEnded: false, xp: 0 };

    const recipe = task.recipeId ? await taskRepo.findRecipe(task.recipeId, tx) : null;
    if (!recipe) throw notFound("recipe_not_found");

    const required = await taskRepo.findRequiredResourcesForRecipe(recipe.id, tx);
    const inputs = await taskRepo.findTaskRecipeInputs(task.id, tx);
    const actions = await taskRepo.findTaskActions(task.id, tx);
    const rarities = await taskRepo.findAllRarities(tx);
    const output = await findRecipeOutput(recipe, tx);
    const stats = (await getStatsPerCategory(userId))[recipe.categoryId];
    const xpRate = await taskRepo.findCategoryXpRate(recipe.categoryId, tx);

    const rotation = calculateRotation(actions, stats);
    const succeeded = rotation.progress >= recipe.progressRequirement;

    const inputRarityByResource = new Map(inputs.map((i) => [i.resourceId, i.rarityId]));
    const owned = required.length > 0
        ? await inventoryService.getOwnedResources(userId, required.map((r) => r.resourceId), tx)
        : [];
    const affordable = Math.min(...required.map((r) => {
        const rarityId = inputRarityByResource.get(r.resourceId);
        const have = owned.find((o) => o.resourceId === r.resourceId && o.rarityId === rarityId)?.quantity ?? 0;
        return Math.floor(have / r.amount);
    }));

    const craftsLeft = (task.craftCount ?? 0) - task.completedCount;
    const crafts = succeeded ? Math.min(cycles, craftsLeft, affordable) : 0;

    await inventoryService.takeResources(userId, required.map((r) => ({
        resourceId: r.resourceId,
        rarityId: inputRarityByResource.get(r.resourceId)!,
        amount: r.amount * crafts,
    })), tx);

    const rarityById = new Map(rarities.map((r) => [r.id, r]));
    const inputTiers = required.map((r) => ({
        amount: r.amount,
        tier: rarityById.get(inputRarityByResource.get(r.resourceId) ?? "")?.tier ?? 1,
    }));
    const qualityRatio = recipe.qualityRequirement > 0 ? rotation.quality / recipe.qualityRequirement : 0;
    const craftable = output.rarityIds ? rarities.filter((r) => output.rarityIds!.has(r.id)) : rarities;
    const boostedRarities = Object.values(applyRarityMultiplier(
        Object.fromEntries((craftable.length > 0 ? craftable : rarities).map((r) => [r.id, r])),
        craftRarityMultiplier(qualityRatio, inputTiers),
    ));

    const craftedByRarity = new Map<string, number>();
    for (let i = 0; i < crafts; i++) {
        const rarityId = getItemRarity(boostedRarities).id;
        craftedByRarity.set(rarityId, (craftedByRarity.get(rarityId) ?? 0) + 1);
    }

    const made = [...craftedByRarity].map(([rarityId, craftCount]) => ({
        rarityId, craftCount, amount: craftCount * recipe.outputQuantity,
    }));
    if (output.type === "equipment") {
        await inventoryService.addEquipment(userId, made.map(({ rarityId, amount }) => ({ equipmentId: output.item.id, rarityId, amount })), tx);
    } else {
        await inventoryService.addResources(userId, made.map(({ rarityId, amount }) => ({ resourceId: output.item.id, rarityId, amount })), tx);
    }

    const xpEarned = made.reduce((sum, { rarityId, craftCount }) =>
        sum + calculateXp(xpRate, output.item.tier, rarityById.get(rarityId)!.tier, craftCount), 0);
    await progressService.addXp(userId, recipe.categoryId, xpEarned, tx);

    const completedCount = task.completedCount + crafts;
    const taskEnded = completedCount >= (task.craftCount ?? 0) || affordable - crafts < 1;

    if (taskEnded) await taskRepo.deleteTaskByUser(userId, tx);
    else await taskRepo.updateTaskAfterClaim(task.id, claimedUntil, completedCount, tx);

    const items: ClaimedItem[] = made.map(({ rarityId, amount }) => output.type === "equipment"
        ? { type: "equipment", equipment: output.item, rarity: rarityById.get(rarityId)!, amount }
        : { type: "resource", resource: output.item, rarity: rarityById.get(rarityId)!, amount });

    return { cyclesClaimed: cycles, successfulCycles: crafts, items, nextCycleAt, taskEnded, xp: xpEarned};
}

type Recipe = NonNullable<Awaited<ReturnType<typeof taskRepo.findRecipe>>>;

async function findRecipeOutput(recipe: Recipe, tx: Connection) {
    if (recipe.outputEquipmentId !== null) {
        const item = await taskRepo.findEquipment(recipe.outputEquipmentId, tx);
        if (!item) throw notFound("recipe_not_found");
        const rarityIds = new Set(await taskRepo.findEquipmentRarityIds(recipe.outputEquipmentId, tx));
        return { type: "equipment" as const, item, rarityIds: rarityIds.size > 0 ? rarityIds : null };
    }

    const item = recipe.outputResourceId ? await taskRepo.findResource(recipe.outputResourceId, tx) : null;
    if (!item) throw notFound("recipe_not_found");
    return { type: "resource" as const, item, rarityIds: null };
}

export async function stopTask(userId: string): Promise<ClaimResult | null> {
    return db.transaction(async (tx) => {
        const task = await taskRepo.findTaskByUserForUpdate(userId, tx);
        if (!task) throw notFound("no_active_task");

        const claim = await claimLockedTask(userId, task, tx);

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


type RotationTarget = { categoryId: string; progressRequirement: number };

async function findRotationTarget(target: TaskTarget, conn: Connection): Promise<RotationTarget> {
    if (target.type === "gather") {
        const group = await taskRepo.findGatheringGroupWithMainResource(target.gatheringGroupId, conn);
        if (!group?.mainResource) throw notFound("gathering_group_not_found");
        return group.mainResource;
    }

    const recipe = await taskRepo.findRecipe(target.recipeId, conn);
    if (!recipe) throw notFound("recipe_not_found");
    return recipe;
}

async function assertRotationIsValid(userId: string, target: RotationTarget, rotation: Action[], conn: Connection) {
    const stats = (await getStatsPerCategory(userId))[target.categoryId];
    const totals = calculateRotation(rotation, stats);

    if (totals.gpUsed > (stats?.gatheringPoints ?? 0)) throw badRequest("not_enough_gp_for_rotation");
    if (totals.progress < target.progressRequirement) throw badRequest("not_enough_progress_for_task");
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

function cycleLengthMs(rotation: Pick<Action, "delaySeconds">[]): number {
    const seconds = rotation.reduce((sum, a) => sum + a.delaySeconds, TASK_BASE_CYCLE_SECONDS);
    return Math.round(seconds * 1000);
}

function mainAmountPerCycle(rotationYield: number, yieldRequirement: number) {
    if (yieldRequirement <= 0) return 1;
    return Math.max(1, Math.floor(rotationYield / yieldRequirement / 0.25));
}


class LootTally {
    private readonly byKey = new Map<string, { resource: Resource; rarity: Rarity; amount: number }>();

    add(resource: Resource, rarity: Rarity, amount: number) {
        const key = `${resource.id}:${rarity.id}`;
        const entry = this.byKey.get(key);
        if (entry) entry.amount += amount;
        else this.byKey.set(key, { resource, rarity, amount });
    }

    entries() {
        return [...this.byKey.values()];
    }

    stacks() {
        return this.entries().map(({ resource, rarity, amount }) => ({ resourceId: resource.id, rarityId: rarity.id, amount }));
    }
}
