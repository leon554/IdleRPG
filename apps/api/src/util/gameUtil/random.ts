

export function getItemRarity(){
    const randomNum = Math.random()

    
}

export function applyRarityMultiplier<T extends Record<string, { tier: number; odds: number }>>(rarities: T, multiplier: number): T {
    return Object.fromEntries(
        Object.entries(rarities).map(([key, rarity]) => [
            key,
            { ...rarity, odds: rarity.odds * (1 + multiplier/5) ** (rarity.tier - 1) },
        ])
    ) as T;
}