
export function getItemRarity<T extends { odds: number }>(rarities: T[]): T {
    const total = rarities.reduce((sum, r) => sum + r.odds, 0);
    let roll = Math.random() * total;

    for (const rarity of rarities) {
        roll -= rarity.odds;
        if (roll < 0) return rarity;
    }
    return rarities[rarities.length - 1];
}

export function applyRarityMultiplier<T extends Record<string, { tier: number; odds: number }>>(rarities: T, multiplier: number): T {
    return Object.fromEntries(
        Object.entries(rarities).map(([key, rarity]) => [
            key,
            { ...rarity, odds: rarity.odds * (1 + multiplier/5) ** (rarity.tier - 1) },
        ])
    ) as T;
}