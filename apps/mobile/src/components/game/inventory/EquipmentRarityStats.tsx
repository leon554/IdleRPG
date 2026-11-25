import { ScrollView, Text, View } from "react-native";
import type { EquipmentStack } from "@idlerpg/shared";
import { EQUIPMENT, RARITIES, type EquipmentId, type RarityDef, type RarityId } from "@idlerpg/shared/src/gameData";
import { StatList } from "@/components/game/equipment/StatList";
import { GameDataUtil } from "@/util/game-data-util";

export function EquipmentRarityStats({ stacks }: { stacks: EquipmentStack[] }) {
    const def = EQUIPMENT[stacks[0].equipment.id as EquipmentId];
    const ownedByRarity = new Map(stacks.map((s) => [s.rarity.id, s.quantity]));

    const rows = (Object.entries(RARITIES) as [RarityId, RarityDef][])
        .map(([rarityId, rarity]) => ({ rarityId, rarity, stats: def?.stats[rarityId] }))
        .filter((row) => row.stats !== undefined);

    if (rows.length === 0) {
        return <Text className="text-textMuted text-xs text-center">No stats for this item.</Text>;
    }

    return (
        <ScrollView className="max-h-96" contentContainerClassName="gap-2" showsVerticalScrollIndicator={false}>
            {rows.map(({ rarityId, rarity, stats }) => {
                const owned = ownedByRarity.get(rarityId);
                return (
                    <View
                        key={rarityId}
                        className={`gap-1.5 rounded-md border border-border px-3 py-2.5 ${owned ? "" : "opacity-50"}`}
                    >
                        <View className="flex-row items-center gap-2">
                            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: rarity.color }} />
                            <Text className="text-textSecondary flex-1">{rarity.name}</Text>
                            <Text className="text-textMuted text-xs">
                                {owned ? `Owned ×${GameDataUtil.formatCompactNumber(owned)}` : "Not owned"}
                            </Text>
                        </View>
                        <StatList stats={stats!} />
                    </View>
                );
            })}
        </ScrollView>
    );
}
