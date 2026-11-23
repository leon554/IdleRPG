import { Text, View } from "react-native";
import type { ClaimedItem } from "@idlerpg/shared";
import { GameDataUtil } from "@/util/game-data-util";

const itemName = (i: ClaimedItem) => (i.type === "equipment" ? i.equipment.name : i.resource.itemName);
const itemId = (i: ClaimedItem) => (i.type === "equipment" ? i.equipment.id : i.resource.id);

export function ClaimedItemsToast({ items}: { items: ClaimedItem[]; title?: string }) {
    const sorted = [...items].sort((a, b) => b.rarity.tier - a.rarity.tier || itemName(a).localeCompare(itemName(b)));

    return (
        <View className="gap-1.5">
            <View className="flex-row flex-wrap gap-1.5">
                {sorted.map((item) => (
                    <View
                        key={`${item.type}:${itemId(item)}:${item.rarity.id}`}
                        className="flex-row items-center gap-1.5 rounded-md border border-border px-2 py-0.5"
                    >
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.rarity.color }} />
                        <Text className="text-xs text-textSecondary">{itemName(item)}</Text>
                        <Text className="text-xs font-semibold text-textSecondary">
                            ×{GameDataUtil.formatCompactNumber(item.amount)}
                        </Text>
                    </View>
                ))}
            </View>
        </View>
    );
}
