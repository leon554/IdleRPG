import type { CategoryStats, GatheringGroup, InventoryStack } from "@idlerpg/shared"
// Runtime values come from the file directly (like GatherModal's RARITIES): Metro can't resolve
// the "./gameData.js" re-exports in the shared index, so only types are imported from "@idlerpg/shared"
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

    // Gold for one item of this stack: vendorPrice ^ rarity tier (the same formula the API pays out with)
    export function getVendorSellPrice(stack: InventoryStack){
        const vendorPrice = stack.type == "equipment" ? stack.equipment.vendorPrice : stack.resource.vendorPrice
        return unitSellPrice(vendorPrice, stack.rarity.tier)
    }

    // How each stat changes going from `current` to `next` (positive = better)
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

    // 1230 -> "1.23k", 1293000 -> "1.29m", 4500000000 -> "4.5b", 999 -> "999".
    // Rounds down (999999 -> "999.99k", never "1000k"), so it never shows more than the real amount,
    // and drops trailing zeros (1000 -> "1k", 1500 -> "1.5k").
    export function formatCompactNumber(value: number, decimals = 2): string {
        if (!Number.isFinite(value)) return String(value);

        const sign = value < 0 ? "-" : "";
        const abs = Math.abs(value);
        const unit = COMPACT_UNITS.find((u) => abs >= u.value);

        const scaled = unit ? abs / unit.value : abs;
        const factor = 10 ** decimals;
        // The small epsilon stops float error turning e.g. 1.29 into 1.2899999 before rounding down
        const truncated = Math.floor(scaled * factor + 1e-9) / factor;

        return `${sign}${Number(truncated.toFixed(decimals))}${unit?.suffix ?? ""}`;
    }
}