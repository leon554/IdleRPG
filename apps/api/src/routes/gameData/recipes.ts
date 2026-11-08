
import { requireAuth } from "../../middleware/requireAuth.js";
import { db } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { categories, equipment, recipes, requiredResources, resources } from "../../db/schema.js";
import { Router } from "express";
import { Util } from "../../util/generalUtil/util.js";

export const recipeRouter = Router()
recipeRouter.get("/recipes", requireAuth, async (req, res) => {

    const recipeRows = await db.select({
        id: recipes.id,
        name: recipes.name,
        category: categories.name,
        outputEquipmentId: recipes.outputEquipmentId,
        levelRequirement: recipes.levelRequirement,
        equipmentName: equipment.name,
    })
    .from(recipes)
    .innerJoin(categories, eq(recipes.categoryId, categories.id))
    .innerJoin(equipment, eq(recipes.outputEquipmentId, equipment.id))
    .orderBy(recipes.name)

    const requiredRows = await db
        .select({
        recipeId: requiredResources.recipeId,
        resourceId: requiredResources.resourceId,
        name: resources.itemName,
        amount: requiredResources.amount,
    })
    .from(requiredResources)
    .innerJoin(resources, eq(resources.id, requiredResources.resourceId));

    const requiredResourcesPerRecipe: Map<string, Omit<(typeof requiredRows)[number], "recipeId">[]> = new Map()
    requiredRows.forEach(r => {
        const prev = requiredResourcesPerRecipe.get(r.recipeId)
        const newR = Util.removeObjectKey(r, "recipeId")
        requiredResourcesPerRecipe.set(r.recipeId, prev ? [...prev, newR] : [newR])
    })

    const output = recipeRows.map(r => ({...r, requiredResources: requiredResourcesPerRecipe.get(r.id) ?? []}))

    res.status(200).json({recipes: output})
})