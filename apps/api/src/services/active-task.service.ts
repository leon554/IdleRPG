import { asc, eq } from "drizzle-orm";
import { db } from "../db/index.js";
import { actions, recipes, requiredResources, resources, task, taskAction, taskRecipeInput } from "../db/schema.js";

async function getTaskActions(taskId: string) {
    const rows = await db
        .select({ position: taskAction.position, action: actions })
        .from(taskAction)
        .innerJoin(actions, eq(actions.id, taskAction.actionId))
        .where(eq(taskAction.taskId, taskId))
        .orderBy(asc(taskAction.position));

    return rows.map(({ position, action }) => ({ position, ...action }));
}

async function getRecipeDetails(taskId: string, recipeId: string) {
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

    return { recipe, requiredResources: required, inputs };
}

export async function getActiveTask(userId: string) {
    const [activeTask] = await db.select().from(task).where(eq(task.userId, userId));
    if (!activeTask) return null;

    const taskActions = await getTaskActions(activeTask.id);
    const base = { ...activeTask, actions: taskActions };

    if (activeTask.recipeId === null) return base;

    return { ...base, ...(await getRecipeDetails(activeTask.id, activeTask.recipeId)) };
}
