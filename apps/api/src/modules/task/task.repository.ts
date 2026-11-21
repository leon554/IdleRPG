import { type Connection } from "../../types/db.js";
import { actions, resources, resourceGatheringGroup, recipes, requiredResources, task, taskAction, taskRecipeInput, gatheringGroupSecondaryResources } from "../../db/schema.js";
import { inArray, eq, asc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import type { RecipeInput, TaskActionEntry, TaskTarget } from "@idlerpg/shared";

export async function findExistingActionIds(actionIds: string[], conn: Connection = db): Promise<string[]> {
    const uniqueIds = [...new Set(actionIds)]
    if (uniqueIds.length === 0) return []

    const rows = await conn
        .select({ id: actions.id })
        .from(actions)
        .where(inArray(actions.id, uniqueIds))

    return rows.map((a) => a.id)
}

export async function findGatheringGroupRequirements(gatheringGroupId: string, conn: Connection = db) {
    const rows = await conn
        .select({
            categoryId: resources.categoryId,
            levelRequirement: resourceGatheringGroup.levelRequirement,
            xpRequirement: resourceGatheringGroup.xpRequirement,
        })
        .from(resourceGatheringGroup)
        .innerJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
        .where(eq(resourceGatheringGroup.id, gatheringGroupId));

    return firstOrNull(rows)
}

export async function findRecipeRequirements(recipeId: string, conn: Connection = db) {
    const rows = await conn
        .select({ categoryId: recipes.categoryId, levelRequirement: recipes.levelRequirement })
        .from(recipes)
        .where(eq(recipes.id, recipeId));

    return firstOrNull(rows)
}

export async function findRequiredResourcesForRecipe(recipeId: string, conn: Connection = db) {
    return conn
        .select({ resourceId: requiredResources.resourceId, amount: requiredResources.amount })
        .from(requiredResources)
        .where(eq(requiredResources.recipeId, recipeId));
}

export async function insertTask(userId: string, target: TaskTarget, conn: Connection = db) {
    const [created] = await conn
        .insert(task)
        .values({
            userId,
            gatheringGroupId: target.type === "gather" ? target.gatheringGroupId : null,
            recipeId: target.type === "craft" ? target.recipeId : null,
            craftCount: target.type === "craft" ? target.craftCount : null,
        })
        .returning();

    return created
}

export async function insertTaskActions(taskId: string, actionIds: string[], conn: Connection = db) {
    if (actionIds.length === 0) return
    await conn.insert(taskAction).values(
        actionIds.map((actionId, position) => ({ taskId, actionId, position })),
    );
}

export async function insertTaskRecipeInputs(taskId: string, inputs: RecipeInput[], conn: Connection = db) {
    if (inputs.length === 0) return
    await conn.insert(taskRecipeInput).values(inputs.map((input) => ({ taskId, ...input })));
}

// ── Active task ───────────────────────────────────────────────────

export async function findTaskByUser(userId: string, conn: Connection = db) {
    const rows = await conn.select().from(task).where(eq(task.userId, userId));
    return firstOrNull(rows)
}

export async function findTaskActions(taskId: string, conn: Connection = db): Promise<TaskActionEntry[]> {
    const rows = await conn
        .select({ position: taskAction.position, action: actions })
        .from(taskAction)
        .innerJoin(actions, eq(actions.id, taskAction.actionId))
        .where(eq(taskAction.taskId, taskId))
        .orderBy(asc(taskAction.position));

    return rows.map(({ position, action }) => ({ position, ...action }));
}

export async function findRecipe(recipeId: string, conn: Connection = db) {
    const rows = await conn.select().from(recipes).where(eq(recipes.id, recipeId));
    return firstOrNull(rows)
}

export async function findRequiredResourcesWithNames(recipeId: string, conn: Connection = db) {
    return conn
        .select({
            resourceId: requiredResources.resourceId,
            name: resources.itemName,
            amount: requiredResources.amount,
        })
        .from(requiredResources)
        .innerJoin(resources, eq(resources.id, requiredResources.resourceId))
        .where(eq(requiredResources.recipeId, recipeId));
}

export async function findTaskRecipeInputs(taskId: string, conn: Connection = db): Promise<RecipeInput[]> {
    return conn
        .select({ resourceId: taskRecipeInput.resourceId, rarityId: taskRecipeInput.rarityId })
        .from(taskRecipeInput)
        .where(eq(taskRecipeInput.taskId, taskId));
}

// ── Claiming ──────────────────────────────────────────────────────

export async function findGatheringGroupWithMainResource(gatheringGroupId: string, conn: Connection = db) {
    const rows = await conn
        .select({
            id: resourceGatheringGroup.id,
            mainResource: resources,
            levelRequirement: resourceGatheringGroup.levelRequirement,
            xpRequirement: resourceGatheringGroup.xpRequirement,
        })
        .from(resourceGatheringGroup)
        .leftJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
        .where(eq(resourceGatheringGroup.id, gatheringGroupId));

    return firstOrNull(rows)
}

export async function findGatheringGroupSecondaryResources(gatheringGroupId: string, conn: Connection = db) {
    return conn
        .select({
            resourceId: gatheringGroupSecondaryResources.resourceId,
            dropChance: gatheringGroupSecondaryResources.dropChance,
            resource: resources,
        })
        .from(gatheringGroupSecondaryResources)
        .innerJoin(resources, eq(resources.id, gatheringGroupSecondaryResources.resourceId))
        .where(eq(gatheringGroupSecondaryResources.gatheringGroupId, gatheringGroupId));
}
