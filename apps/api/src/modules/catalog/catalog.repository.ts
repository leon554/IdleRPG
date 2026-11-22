import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import {
    actions, categories, equipment, equipmentStats, gatheringGroupSecondaryResources,
    recipes, requiredResources, resourceGatheringGroup, resources,
} from "../../db/schema.js";
import type { Connection } from "../../types/db.js";


export async function findRecipesWithOutput(conn: Connection = db) {
    return conn
        .select({
            recipe: recipes,
            categoryName: categories.name,
            categoryId: categories.id,
            outputEquipment: equipment,
        })
        .from(recipes)
        .innerJoin(categories, eq(recipes.categoryId, categories.id))
        .innerJoin(equipment, eq(recipes.outputEquipmentId, equipment.id))
        .orderBy(recipes.name);
}

export async function findAllEquipmentStats(conn: Connection = db) {
    return conn.select().from(equipmentStats);
}

export async function findAllRequiredResources(conn: Connection = db) {
    return conn
        .select({
            recipeId: requiredResources.recipeId,
            resourceId: requiredResources.resourceId,
            name: resources.itemName,
            amount: requiredResources.amount,
        })
        .from(requiredResources)
        .innerJoin(resources, eq(resources.id, requiredResources.resourceId));
}


export async function findGatheringGroups(conn: Connection = db) {
    return conn
        .select({
            id: resourceGatheringGroup.id,
            name: resourceGatheringGroup.name,
            mainResource: resources,
            levelRequirement: resourceGatheringGroup.levelRequirement,
            category: categories.name,
            categoryId: categories.id,
        })
        .from(resourceGatheringGroup)
        .innerJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
        .innerJoin(categories, eq(resources.categoryId, categories.id));
}

export async function findAllSecondaryResources(conn: Connection = db) {
    return conn
        .select({
            gatheringGroupId: gatheringGroupSecondaryResources.gatheringGroupId,
            dropChance: gatheringGroupSecondaryResources.dropChance,
            resource: resources,
        })
        .from(gatheringGroupSecondaryResources)
        .innerJoin(resources, eq(resources.id, gatheringGroupSecondaryResources.resourceId));
}


export async function findAllActions(conn: Connection = db) {
    return conn.select().from(actions).orderBy(asc(actions.name));
}
