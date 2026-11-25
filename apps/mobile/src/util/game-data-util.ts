import type { CategoryStats, GatheringGroup, InventoryStack, ResourceStack } from "@idlerpg/shared"
import { unitSellPrice } from "@idlerpg/shared/src/gameData"

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

    export const formatDuration = (ms: number): string => {
        const totalSeconds = Math.max(0, Math.floor(ms / 1000));

        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        const pad = (n: number) => String(n).padStart(2, "0");

        return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
    };

    export function getVendorSellPrice(stack: InventoryStack){
        const vendorPrice = stack.type == "equipment" ? stack.equipment.vendorPrice : stack.resource.vendorPrice
        return unitSellPrice(vendorPrice, stack.rarity.tier)
    }

    export function statDiff(next: CategoryStats, current: CategoryStats): CategoryStats {
        return {
            progress: next.progress - current.progress,
            quality: next.quality - current.quality,
            yield: next.yield - current.yield,
            gatheringPoints: next.gatheringPoints - current.gatheringPoints,
        };
    }

    const COMPACT_UNITS = [
        { value: 1_000_000_000, suffix: "b" },
        { value: 1_000_000, suffix: "m" },
        { value: 1_000, suffix: "k" },
    ] as const;

    export function formatCompactNumber(value: number, decimals = 2): string {
        if (!Number.isFinite(value)) return String(value);

        const sign = value < 0 ? "-" : "";
        const abs = Math.abs(value);
        const unit = COMPACT_UNITS.find((u) => abs >= u.value);

        const scaled = unit ? abs / unit.value : abs;
        const factor = 10 ** decimals;
        const truncated = Math.floor(scaled * factor + 1e-9) / factor;

        return `${sign}${Number(truncated.toFixed(decimals))}${unit?.suffix ?? ""}`;
    }

    export function groupItemStacksByItemId(stacks: InventoryStack[]){
        const map = new Map<string, InventoryStack[]>()

        stacks.forEach(s => {
            if(s.type == "resource"){
                let arr = map.get(s.resource.id) ?? []
                arr.push(s)
                map.set(s.resource.id, arr)
            }else{
                let arr = map.get(s.equipment.id) ?? []
                arr.push(s)
                map.set(s.equipment.id, arr)
            }
        })

        return Array.from(map.values())
    }
}