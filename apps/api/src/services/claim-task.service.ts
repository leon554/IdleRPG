import {type GatherActiveTask } from "@idlerpg/shared";
import { db } from "../db/index.js";
import { resourceGatheringGroup, gatheringGroupSecondaryResources as ggsr, resources } from "../db/schema.js";
import { eq } from "drizzle-orm";
import { getStatsPerCategory } from "./stats.service.js";

export async function claimResources(userId: string, task: GatherActiveTask){
    const [[group], secondaryResources] = await Promise.all([
        db.select({
            id: resourceGatheringGroup.id,
            mainResource: resources,
            levelRequirement: resourceGatheringGroup.levelRequirement,
            xpRequirement: resourceGatheringGroup.xpRequirement,
        })
            .from(resourceGatheringGroup)
            .leftJoin(resources, eq(resources.id, resourceGatheringGroup.mainResourceId))
            .where(eq(resourceGatheringGroup.id, task.gatheringGroupId)),

        db.select({
            resourceId: ggsr.resourceId,
            dropChance: ggsr.dropChance,
            resource: resources,
        })
        .from(ggsr)
        .innerJoin(resources, eq(resources.id, ggsr.resourceId))
        .where(eq(ggsr.gatheringGroupId, task.gatheringGroupId)),
    ]);

    const statsPerCategory = await getStatsPerCategory(userId)
    const categoryStats = statsPerCategory[group.mainResource?.categoryId ?? ""]

    const stats = {progress: 0, qaulity: 0, yield: 0}
    
    task.actions.forEach(a => {
        stats.progress += a.progressMultiplier * categoryStats.progress
        stats.qaulity += a.qualityMultiplier * categoryStats.quality
        stats.yield += a.yieldMultiplier * categoryStats.yield
    })

    //calculate odds then do the claims

    if (!group) return null;
    return { ...group, secondaryResources };
}