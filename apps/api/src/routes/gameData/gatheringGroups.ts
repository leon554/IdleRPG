import { recipeRouter } from "./recipes.js";
import { db } from "../../db/index.js";
import { categories, gatheringGroupSecondaryResources, resourceGatheringGroup, resources } from "../../db/schema.js";
import { eq } from "drizzle-orm";
import { Util } from "../../util/generalUtil/util.js";
import { Router } from "express";

export const gatheringGroupRouter = Router()
gatheringGroupRouter.get("/gathering-groups", async (req, res) => {
    const gg = await db.select({
        id: resourceGatheringGroup.id,
        mainResource: resourceGatheringGroup.mainResourceId,
        levelRequirement: resourceGatheringGroup.levelRequirement,
        category: categories.name 
    })
    .from(resourceGatheringGroup)
    .innerJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
    .innerJoin(categories, eq(resources.categoryId, categories.id))

    const secondaryResources = await db.select({
        gatheringGroupId: gatheringGroupSecondaryResources.gatheringGroupId,
        dropChance: gatheringGroupSecondaryResources.dropChance,
        resourceName: resources.itemName,
        progressRequirement: resources.progressRequirement,
        qualityRequirement: resources.qualityRequirement,
        yieldRequirement: resources.yieldRequirement,
        vendorPrice: resources.vendorPrice,

    })
    .from(gatheringGroupSecondaryResources)
    .innerJoin(resources, eq(resources.id, gatheringGroupSecondaryResources.resourceId))

    const resourcesPerGG: Map<string, Omit<(typeof secondaryResources)[number], "gatheringGroupId">[]> = new Map()
    secondaryResources.forEach(r => {
        let prev = resourcesPerGG.get(r.gatheringGroupId)
        let idOmittedRow = Util.removeObjectKey(r, "gatheringGroupId")
        resourcesPerGG.set(r.gatheringGroupId, prev ? [...prev, idOmittedRow] : [idOmittedRow])
    })

    let output = gg.map(r => ({...r, secondaryResources: resourcesPerGG.get(r.id) ?? []}))

    res.status(200).json(output)
})