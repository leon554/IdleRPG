import { Card } from "@/components/primitives/Card";
import { GameDataUtil } from "@/util/game-data-util";
import { InventoryStack } from "@idlerpg/shared";
import { useState } from "react";
import { View, Text } from "react-native";
import { InventoryItemModal, stackName } from "./InventoryItemModal";


function RarityDots({ stacks }: { stacks: InventoryStack[] }) {
    const sorted = [...stacks].sort((a, b) => a.rarity.tier - b.rarity.tier)

    return (
        <View className="flex-row gap-1">
            {sorted.map((s) => (
                <View key={s.rarity.id} className="w-2 h-2 rounded-full" style={{ backgroundColor: s.rarity.color }} />
            ))}
        </View>
    )
}
export function InventoryRow({ stacks, isLast }: { stacks: InventoryStack[]; isLast: boolean }) {
    const [open, setOpen] = useState(false)
    const total = stacks.reduce((sum, s) => sum + s.quantity, 0)

    return (
        <>
            <Card variant="none" className={`gap-2 px-4 py-3 ${isLast ? '' : 'border-b border-border'}`}
                onPress={() => setOpen(true)}
            >
                <View className="flex-row items-center justify-between gap-3">
                    <Text className="text-textPrimary text-md font-medium flex-1" numberOfLines={1}>
                        {stackName(stacks[0])}
                    </Text>
                    <Text className="text-textSecondary text-sm">
                        {GameDataUtil.formatCompactNumber(total)}
                    </Text>
                </View>
                <RarityDots stacks={stacks} />
            </Card>
            {open && <InventoryItemModal stacks={stacks} onClose={() => setOpen(false)} />}
        </>
    )
}
