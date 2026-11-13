import { GatheringGroup } from "@idlerpg/shared"

export namespace GameDataUtil{
    export function getGGPerCategoryMap(gatheringGroups: GatheringGroup[]){
        const map: Map<string, GatheringGroup[]> = new Map()
        gatheringGroups?.forEach(g => {
            const prev = map.get(g.categoryId)
            if(prev){
                prev.push(g)
            }else{
                map.set(g.categoryId, [g])
            }
        })
        return Object.fromEntries(map); 
    }
}