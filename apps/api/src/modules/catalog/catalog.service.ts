import { Util } from "../../util/generalUtil/util.js";
import * as catalogRepo from "./catalog.repository.js";

export async function getRecipesByCategory() {
    const [recipeRows, equipmentStatsRows, requiredRows] = await Promise.all([
        catalogRepo.findRecipesWithOutput(),
        catalogRepo.findAllEquipmentStats(),
        catalogRepo.findAllRequiredResources(),
    ]);

    const requiredPerRecipe = Util.groupByKey(requiredRows, "recipeId");
    const statsPerEquipment = Util.groupByKey(equipmentStatsRows, "equipmentId");

    const output = recipeRows.map(r => ({
        ...r,
        requiredResources: requiredPerRecipe.get(r.recipe.id) ?? [],
        // Rarities the output can roll at (equipment only; a resource output rolls any rarity)
        stats: r.recipe.outputEquipmentId ? statsPerEquipment.get(r.recipe.outputEquipmentId) ?? [] : []
    }))
    return Object.groupBy(output, (r) => r.categoryId);
}

export async function getGatheringGroups() {
    const [groups, secondaryRows] = await Promise.all([
        catalogRepo.findGatheringGroups(),
        catalogRepo.findAllSecondaryResources(),
    ]);

    const secondaryPerGroup = Util.groupByKey(secondaryRows, "gatheringGroupId");
    return groups.map(g => ({ ...g, secondaryResources: secondaryPerGroup.get(g.id) ?? [] }))
}

const actionsCache = Util.createStaticCache(() => catalogRepo.findAllActions());

export function getActions() {
    return actionsCache.get();
}
