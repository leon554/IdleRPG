import { useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native'
import type { InventoryStack } from '@idlerpg/shared'
import { Screen } from '@/components/primitives/Screen'
import PageHeader from '@/components/primitives/PageHeader'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { toast } from '@/components/primitives/Toast'
import { useStore } from '@/lib/store'
import { errorMessage } from '@/lib/api-service-layer/errors'
import { inventoryStore, loadInventory } from '@/stores/inventory'
import { colors } from '@/theme'
import { InventoryRow } from '@/components/game/inventory/InvetoryRow'
import { GameDataUtil } from '@/util/game-data-util'

const stackKey = (s: InventoryStack) =>
    `${s.type}:${s.type === 'resource' ? s.resource.id : s.equipment.id}:${s.rarity.id}`

export default function InventoryScreen() {
    const inventory = useStore(inventoryStore, (s) => s.inventory)
    const status = useStore(inventoryStore, (s) => s.status)
    const [refreshing, setRefreshing] = useState(false)

    const onRefresh = async () => {
        setRefreshing(true)
        try {
            await loadInventory()
        } catch (error) {
            toast.error(errorMessage(error))
        } finally {
            setRefreshing(false)
        }
    }

    if (!inventory) {
        return (
            <Screen className="gap-3">
                <PageHeader name="Inventory" />
                {status === 'error' ? (
                    <Card className="gap-3 items-center">
                        <Text className="text-textSecondary">Couldn't load your inventory.</Text>
                        <Button title="Try again" size="sm" className="self-center" onPress={onRefresh} />
                    </Card>
                ) : (
                    <ActivityIndicator color={colors.primary} className="mt-6" />
                )}
            </Screen>
        )
    }

    const stacks: InventoryStack[] = [...inventory.resources, ...inventory.equipment]

    return (
        <Screen className="gap-3">
            <PageHeader name="Inventory" />

            <Card className="flex-row justify-between items-center">
                <View>
                    <Text className="text-textMuted text-xs">Gold</Text>
                    <Text className="text-textPrimary text-lg font-semibold">{GameDataUtil.formatCompactNumber(inventory.gold)}</Text>
                </View>
                <View className="items-end">
                    <Text className="text-textMuted text-xs">Space</Text>
                    <Text className="text-textPrimary text-lg font-semibold">
                        {inventory.usedSpace} / {inventory.maxSpace}
                    </Text>
                </View>
            </Card>

            <FlatList
                data={stacks}
                showsVerticalScrollIndicator={false}
                keyExtractor={stackKey}
                renderItem={({ item, index }) => <InventoryRow stack={item} isLast={index === stacks.length - 1} />}
                className="grow-0 rounded-md border border-border bg-surface"
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
                ListEmptyComponent={
                    <View className="px-4 py-6 items-center gap-1">
                        <Text className="text-textSecondary">Your inventory is empty</Text>
                        <Text className="text-textMuted text-xs text-center">
                            Start a gathering task and claim it to collect resources.
                        </Text>
                    </View>
                }
            />
        </Screen>
    )
}
