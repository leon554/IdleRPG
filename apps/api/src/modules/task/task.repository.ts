import { type Connection } from "../../types/db.js";
import { actions, categories, equipment, equipmentStats, rarity, resources, resourceGatheringGroup, recipes, requiredResources, task, taskAction, taskRecipeInput, gatheringGroupSecondaryResources } from "../../db/schema.js";
import { inArray, eq, asc, sql } from "drizzle-orm";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import type { RecipeInput, TaskActionEntry, TaskTarget } from "@idlerpg/shared";

// The actions with these ids (each once, in no particular order)
export async function findActionsByIds(actionIds: string[], conn: Connection = db) {
    const uniqueIds = [...new Set(actionIds)]
    if (uniqueIds.length === 0) return []

    return conn.select().from(actions).where(inArray(actions.id, uniqueIds))
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

export async function insertTask(userId: string, target: TaskTarget, cycleMs: number, conn: Connection = db) {
    const [created] = await conn
        .insert(task)
        .values({
            userId,
            gatheringGroupId: target.type === "gather" ? target.gatheringGroupId : null,
            recipeId: target.type === "craft" ? target.recipeId : null,
            craftCount: target.type === "craft" ? target.craftCount : null,
            cycleMs,
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

export async function findTaskCategoryId(userId: string, conn: Connection = db): Promise<string | null> {
    const rows = await conn
        .select({ categoryId: sql<string | null>`coalesce(${resources.categoryId}, ${recipes.categoryId})` })
        .from(task)
        .leftJoin(resourceGatheringGroup, eq(resourceGatheringGroup.id, task.gatheringGroupId))
        .leftJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
        .leftJoin(recipes, eq(recipes.id, task.recipeId))
        .where(eq(task.userId, userId));
    return firstOrNull(rows)?.categoryId ?? null;
}

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

export async function findAllRarities(conn: Connection = db) {
    return conn.select().from(rarity).orderBy(asc(rarity.tier));
}

export async function findTaskByUserForUpdate(userId: string, conn: Connection) {
    const rows = await conn.select().from(task).where(eq(task.userId, userId)).for("update");
    return firstOrNull(rows)
}

export async function findCategoryXpRate(categoryId: string, conn: Connection = db): Promise<number> {
    const rows = await conn.select({ xpRate: categories.xpRate }).from(categories).where(eq(categories.id, categoryId));
    return firstOrNull(rows)?.xpRate ?? 0;
}

export async function findEquipment(equipmentId: string, conn: Connection = db) {
    const rows = await conn.select().from(equipment).where(eq(equipment.id, equipmentId));
    return firstOrNull(rows)
}

// The rarities this equipment has stats for, i.e. the rarities it can be crafted at
export async function findEquipmentRarityIds(equipmentId: string, conn: Connection = db): Promise<string[]> {
    const rows = await conn
        .select({ rarityId: equipmentStats.rarityId })
        .from(equipmentStats)
        .where(eq(equipmentStats.equipmentId, equipmentId));
    return rows.map((r) => r.rarityId);
}

export async function updateTaskAfterClaim(taskId: string, lastClaimedAt: Date, completedCount: number, conn: Connection = db) {
    await conn.update(task).set({ lastClaimedAt, completedCount }).where(eq(task.id, taskId));
}

export async function deleteTaskByUser(userId: string, conn: Connection = db) {
    const rows = await conn.delete(task).where(eq(task.userId, userId)).returning({ id: task.id });
    return firstOrNull(rows)?.id ?? null;
}