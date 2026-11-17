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

    export function roundToSignificant(value: number, sigDigits = 2): number {
        if (value === 0 || !Number.isFinite(value)) return value;

        const magnitude = Math.floor(Math.log10(Math.abs(value)));
        const decimals = Math.max(0, sigDigits - 1 - magnitude);

        return Number(value.toFixed(decimals));
    }

    export function applyRarityMultiplier<T extends Record<string, { tier: number; odds: number }>>(rarities: T, multiplier: number): T {
        return Object.fromEntries(
            Object.entries(rarities).map(([key, rarity]) => [
                key,
                { ...rarity, odds: rarity.odds * (1 + multiplier/5) ** (rarity.tier - 1) },
            ])
        ) as T;
    }
}