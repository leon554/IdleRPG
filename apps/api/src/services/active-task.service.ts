import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import type { ActiveTask, ActiveTaskRecipe, ActiveTaskRequiredResource, RecipeInput, TaskActionEntry } from "@idlerpg/shared";
import { actions, recipes, requiredResources, resources, task, taskAction, taskRecipeInput } from "../db/schema.js";

async function getTaskActions(taskId: string): Promise<TaskActionEntry[]> {
    const rows = await db
        .select({ position: taskAction.position, action: actions })
        .from(taskAction)
        .innerJoin(actions, eq(actions.id, taskAction.actionId))
        .where(eq(taskAction.taskId, taskId))
        .orderBy(asc(taskAction.position));

    return rows.map(({ position, action }) => ({ position, ...action }));
}

type RecipeDetails = {
    recipe: ActiveTaskRecipe;
    requiredResources: ActiveTaskRequiredResource[];
    inputs: RecipeInput[];
};

async function getRecipeDetails(taskId: string, recipeId: string): Promise<RecipeDetails> {
    const [[recipe], required, inputs] = await Promise.all([
        db.select().from(recipes).where(eq(recipes.id, recipeId)),

        db.select({
            resourceId: requiredResources.resourceId,
            name: resources.itemName,
            amount: requiredResources.amount,
        })
        .from(requiredResources)
        .innerJoin(resources, eq(resources.id, requiredResources.resourceId))
        .where(eq(requiredResources.recipeId, recipeId)),

        db.select({ resourceId: taskRecipeInput.resourceId, rarityId: taskRecipeInput.rarityId })
        .from(taskRecipeInput)
        .where(eq(taskRecipeInput.taskId, taskId)),
    ]);

    return { recipe: recipe!, requiredResources: required, inputs };
}

export async function getActiveTask(userId: string): Promise<ActiveTask | null> {
    const [activeTask] = await db.select().from(task).where(eq(task.userId, userId));
    if (!activeTask) return null;

    const { gatheringGroupId, recipeId, ...rest } = activeTask;
    const base = { ...rest, actions: await getTaskActions(activeTask.id) };

    if (recipeId !== null) {
        return {
            taskType: "crafting",
            ...base,
            gatheringGroupId: null,
            recipeId,
            ...(await getRecipeDetails(activeTask.id, recipeId)),
        };
    }

    return { taskType: "gathering", ...base, gatheringGroupId: gatheringGroupId!, recipeId: null };
}
