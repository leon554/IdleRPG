import { requireAuth } from "../../middleware/requireAuth.js";
import { db } from "../../db/index.js";
import { eq, and } from "drizzle-orm";
import { categories, equipment, equipmentStats, recipes, requiredResources, resources } from "../../db/schema.js";
import { Router } from "express";
import { Util } from "../../util/generalUtil/util.js";
import { twoAttempsASecondPerIpLimiter } from "../../util/authUtil/routeRateLimits.js";

export const recipeRouter = Router()
recipeRouter.get("/recipes", twoAttempsASecondPerIpLimiter, requireAuth, async (req, res) => {

    const [recipeRows, equipmentStatsRows, requiredRows] = await Promise.all([
        db.select({
            recipe: recipes,
            categoryName: categories.name,
            categoryId: categories.id,
            outputEquipment: equipment,
        })
        .from(recipes)
        .innerJoin(categories, eq(recipes.categoryId, categories.id))
        .innerJoin(equipment, eq(recipes.outputEquipmentId, equipment.id))
        .orderBy(recipes.name),

        db.select().from(equipmentStats),

        db.select({
            recipeId: requiredResources.recipeId,
            resourceId: requiredResources.resourceId,
            name: resources.itemName,
            amount: requiredResources.amount,
        })
        .from(requiredResources)
        .innerJoin(resources, eq(resources.id, requiredResources.resourceId)),
    ]);

    const requiredPerRecipe = Util.groupByKey(requiredRows, "recipeId");
    const statsPerEquipment = Util.groupByKey(equipmentStatsRows, "equipmentId");

    const output = recipeRows.map(r => ({
        ...r, 
        requiredResources: requiredPerRecipe.get(r.recipe.id) ?? [],
        stats: statsPerEquipment.get(r.recipe.outputEquipmentId) ?? []
    }))
    const groupedOutput = Object.groupBy(output, (r) => r.categoryId);

    res.status(200).json(groupedOutput)
})