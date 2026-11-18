import { Router, type Response } from "express";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../../db/index.js";
import { actions, categoryLevel, inventory, recipes, requiredResources, resourceCollection, resourceGatheringGroup, resources, task,taskAction, taskRecipeInput} from "../../db/schema.js";
import { getAuthUser } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { arrayOf, int, object, optional, str } from "../../validation/typeValidation.js";
import type { GatheringGroup } from "@idlerpg/shared";

const router = Router();

const MAX_ACTIONS = 20;

const gatherSchema = {
    gatheringGroupId: str(),
    actionIds: arrayOf(str(), 1, MAX_ACTIONS),
};

const craftSchema = {
    recipeId: str(),
    craftCount: int(1, Infinity),
    actionIds: arrayOf(str(), 1, MAX_ACTIONS),
    inputs: optional(arrayOf(object({ resourceId: str(), rarityId: str() }), 0, 50)),
};

type RecipeInput = { resourceId: string; rarityId: string };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type TaskRequirments = {
    categoryId: string;
    levelRequirement: number;
    xpRequirement: number;
}
type RequiredResources = {
    resourceId: string;
    amount: number;
}[]

type TaskTarget =
    | { type: "gather"; gatheringGroupId: string }
    | { type: "craft"; recipeId: string; craftCount: number; inputs: RecipeInput[] };

const fail = (status: number, message: string) => ({ ok: false as const, status, message });
const success = <T,>(payload: T) => ({ ok: true as const, payload });
type Outcome<T> = ReturnType<typeof fail> | ReturnType<typeof success<T>>;

async function validateTaskExistence(tx: Tx, actionIds: string[]): Promise<Outcome<null>>{
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

async function getGatheringRequirments(tx: Tx, gatheringGroupId: string){
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

async function getRecipeRequirments(tx: Tx, recipeId: string){
    const [recipe] = await tx
        .select({ categoryId: recipes.categoryId, levelRequirement: recipes.levelRequirement })
        .from(recipes)
        .where(eq(recipes.id, recipeId));
    return recipe
}

async function validatePlayerMeetsRequirments(tx: Tx, requirments: TaskRequirments, userId: string): Promise<Outcome<null>>{
    const [progress] = await tx
        .select({ level: categoryLevel.level, xp: categoryLevel.xp })
        .from(categoryLevel)
        .where(and(eq(categoryLevel.userId, userId), eq(categoryLevel.categoryId, requirments.categoryId)));

    if ((progress?.level ?? 0) < requirments.levelRequirement || (progress?.xp ?? 0) < requirments.xpRequirement) {
        return fail(403, "You don't meet the requirements for this task");
    }
    return success(null)
}

async function validateInputsAmtMatchRecipeRequirments(tx: Tx, recipeId: string, inputs: RecipeInput[]): Promise<Outcome<{required: RequiredResources, rarityByResource: Map<string, string>}>>{
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

async function getInvetory(tx: Tx, userId: string): Promise<Outcome<{inventory: {id: string}}>> {
    const [inv] = await tx
        .select({ id: inventory.id })
        .from(inventory)
        .where(eq(inventory.userId, userId));
    if (!inv) return fail(404, "Inventory not found");
    return success({inventory: inv})
}

async function getAvaliableResources(tx: Tx, requiredResources: RequiredResources, inventoryId: string): Promise<Outcome<{ resourceId: string; rarityId: string;quantity: number;}[]>>{
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

const createTask = (userId: string, target: TaskTarget, actionIds: string[]) =>
    db.transaction(async (tx) => {
        const outcome = await validateTaskExistence(tx, actionIds)
        if(!outcome.ok) return outcome
       
        let taskRequirments: TaskRequirments | null = null

        if (target.type === "gather") {
            const group = await getGatheringRequirments(tx, target.gatheringGroupId);
            if(!group) return fail(404, "Could not get gathering requirments");
            taskRequirments = group
        } else {
            const recipe = await getRecipeRequirments(tx, target.recipeId)
            if (!recipe) return fail(404, "Recipe not found");
            taskRequirments = {...recipe, xpRequirement: 0}
        }

        const requirmentsOutcome = await validatePlayerMeetsRequirments(tx, taskRequirments, userId)
        if(!requirmentsOutcome.ok) return requirmentsOutcome

        if (target.type === "craft") {
            const inputOutcome = await validateInputsAmtMatchRecipeRequirments(tx, target.recipeId, target.inputs)
            if(!inputOutcome.ok) return inputOutcome

            const requiredResources = inputOutcome.payload.required
            const rarityByResource = inputOutcome.payload.rarityByResource

            if (requiredResources.length > 0) {
                const inventoryOutcome = await getInvetory(tx, userId)
                if (!inventoryOutcome.ok) return inventoryOutcome

                const userResources = await getAvaliableResources(tx, requiredResources, inventoryOutcome.payload.inventory.id)
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

        // 5. Create the task and its related rows
        const [created] = await tx
            .insert(task)
            .values({
                userId,
                gatheringGroupId: target.type === "gather" ? target.gatheringGroupId : null,
                recipeId: target.type === "craft" ? target.recipeId : null,
                craftCount: target.type === "craft" ? target.craftCount : null,
            })
            .returning();

        await tx.insert(taskAction).values(
            actionIds.map((actionId, position) => ({ taskId: created.id, actionId, position })),
        );

        //consider what happens when a recipe is running and a user tries to use the resources allocated 
        const inputs = target.type === "craft" ? target.inputs : [];
        if (inputs.length > 0) {
            await tx.insert(taskRecipeInput).values(inputs.map((input) => ({ taskId: created.id, ...input })));
        }

        return { ok: true as const, task: { ...created, actionIds, inputs } };
    });

// Runs createTask and turns its result (or a duplicate-task error) into a response
const sendCreatedTask = async (res: Response, target: TaskTarget, actionIds: string[]) => {
    const user = getAuthUser(res);
    try {
        const result = await createTask(user.id, target, actionIds);
        if (!result.ok) return res.status(result.status).json({ error: result.message });
        return res.status(201).json(result.task);
    } catch (err) {
        // task_userId_unique: the player already has a task (also covers two requests racing)
        const pg = (err as { cause?: { code?: string; constraint?: string } }).cause;
        if (pg?.code === "23505" && pg.constraint === "task_userId_unique") {
            return res.status(409).json({ error: "You already have an active task" });
        }
        throw err; // withBody passes this to your error middleware
    }
};

router.post(
    "/tasks/gather",
    withBody(gatherSchema, (body, _req, res) =>
        sendCreatedTask(res, { type: "gather", gatheringGroupId: body.gatheringGroupId }, body.actionIds),
    ),
);

router.post(
    "/tasks/craft",
    withBody(craftSchema, (body, _req, res) =>
        sendCreatedTask(
            res,
            { type: "craft", recipeId: body.recipeId, craftCount: body.craftCount, inputs: body.inputs ?? [] },
            body.actionIds,
        ),
    ),
);

export default router;