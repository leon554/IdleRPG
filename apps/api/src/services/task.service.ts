import { and, eq, inArray } from "drizzle-orm";
import { actions, categoryLevel, inventory, recipes, requiredResources, resourceCollection, resourceGatheringGroup, resources, task } from "../db/schema.js";
import type { RecipeInput, TaskTarget } from "@idlerpg/shared";
import type { Tx } from "../types/db.js";
import type { OwnedResource, RequiredResources, TaskRequirements } from "../types/task.js";
import { fail, success, type Outcome } from "../util/generalUtil/outcome.js";

export async function validateTaskExistence(tx: Tx, actionIds: string[]): Promise<Outcome<null>>{
    const uniqueActionIds = [...new Set(actionIds)];

    const foundActions = await tx
        .select({ id: actions.id })
        .from(actions)
        .where(inArray(actions.id, uniqueActionIds));


    if (foundActions.length !== uniqueActionIds.length) {
        return fail(400, "One or more actions don't exist");
    }
    return success(null);
}

export async function getGatheringRequirements(tx: Tx, gatheringGroupId: string){
    const [group] = await tx
        .select({
            categoryId: resources.categoryId,
            levelRequirement: resourceGatheringGroup.levelRequirement,
            xpRequirement: resourceGatheringGroup.xpRequirement,
        })
        .from(resourceGatheringGroup)
        .innerJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
        .where(eq(resourceGatheringGroup.id, gatheringGroupId));
    
    return group
}

export async function getRecipeRequirements(tx: Tx, recipeId: string){
    const [recipe] = await tx
        .select({ categoryId: recipes.categoryId, levelRequirement: recipes.levelRequirement })
        .from(recipes)
        .where(eq(recipes.id, recipeId));
    return recipe
}

export async function validatePlayerMeetsRequirements(tx: Tx, requirements: TaskRequirements, userId: string): Promise<Outcome<null>>{
    const [progress] = await tx
        .select({ level: categoryLevel.level, xp: categoryLevel.xp })
        .from(categoryLevel)
        .where(and(eq(categoryLevel.userId, userId), eq(categoryLevel.categoryId, requirements.categoryId)));

    if ((progress?.level ?? 0) < requirements.levelRequirement || (progress?.xp ?? 0) < requirements.xpRequirement) {
        return fail(403, "You don't meet the requirements for this task");
    }
    return success(null)
}

export async function validateInputsAmtMatchRecipeRequirements(tx: Tx, recipeId: string, inputs: RecipeInput[]): Promise<Outcome<{required: RequiredResources, rarityByResource: Map<string, string>}>>{
    const required = await tx
        .select({ resourceId: requiredResources.resourceId, amount: requiredResources.amount })
        .from(requiredResources)
        .where(eq(requiredResources.recipeId, recipeId));

    const rarityByResource = new Map(inputs.map((i) => [i.resourceId, i.rarityId]));

    const inputsMatch =
        rarityByResource.size === inputs.length &&
        rarityByResource.size === required.length &&
        required.every((r) => rarityByResource.has(r.resourceId));

    
    if (!inputsMatch) {
        return fail(400, "Inputs must pick exactly one rarity for each required resource");
    }
    return success({required, rarityByResource})
}

export async function getInventory(tx: Tx, userId: string): Promise<Outcome<{inventory: {id: string}}>> {
    const [inv] = await tx
        .select({ id: inventory.id })
        .from(inventory)
        .where(eq(inventory.userId, userId));
    if (!inv) return fail(404, "Inventory not found");
    return success({inventory: inv})
}

export async function insertTask(tx: Tx, userId: string, target: TaskTarget){
    const [created] = await tx
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

export async function getAvailableResources(tx: Tx, requiredResources: RequiredResources, inventoryId: string): Promise<Outcome<OwnedResource[]>>{
    const owned = await tx
        .select({
            resourceId: resourceCollection.resourceId,
            rarityId: resourceCollection.rarityId,
            quantity: resourceCollection.quantity,
        })
        .from(resourceCollection)
        .where(
            and(
                eq(resourceCollection.inventoryId, inventoryId),
                inArray(resourceCollection.resourceId, requiredResources.map((r) => r.resourceId)),
            ),
        );
    
    return success(owned)
}
