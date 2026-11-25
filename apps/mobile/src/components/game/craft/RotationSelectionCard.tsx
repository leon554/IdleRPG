import { View, Text, FlatList, ScrollView } from 'react-native'
import { useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { Card } from '../../primitives/Card'
import { ProgressBar } from '../../primitives/ProgressBar'
import { Button } from '../../primitives/Button'
import { TextBox } from '../../primitives/TextBox'
import { toast } from '../../primitives/Toast'
import { useStore } from '@/lib/store'
import { inventoryStore, selectInventoryFull } from '@/stores/inventory'
import { staticDataStore } from '@/stores/staticData'
import { statsStore } from '@/stores/stats'
import { startCraftTask, taskStore } from '@/stores/task'
import { errorMessage } from '@/lib/api-service-layer/errors'
import type { Action, Recipe, ResourceStack } from '@idlerpg/shared'
import { RARITIES, CALCULATE_RARITIES_ODDS_SUM, craftRarityMultiplier } from '@idlerpg/shared/src/gameData'
import { GameDataUtil } from '@/util/game-data-util'

interface Props {
    selectedRecipe: Recipe
    selectedResources: ResourceStack[]
    usedActions: Action[]
    setUsedActions: Dispatch<SetStateAction<Action[]>>
    onBack: () => void
    onStarted: () => void
}

export default function RotationSelectionCard({ selectedRecipe, selectedResources, usedActions, setUsedActions, onBack, onStarted }: Props) {
    const { recipe, requiredResources } = selectedRecipe
    const actions = useStore(staticDataStore, (s) => s.actions)
    const stats = useStore(statsStore, (s) => s.stats[selectedRecipe.categoryId])
    const starting = useStore(taskStore, (s) => s.starting)
    const inventoryFull = useStore(inventoryStore, selectInventoryFull)

    const totals = useMemo(() => usedActions.reduce(
        (t, a) => ({
            progress: t.progress + a.progressMultiplier * (stats?.progress ?? 0),
            quality: t.quality + a.qualityMultiplier * (stats?.quality ?? 0),
            gpUsed: t.gpUsed + a.gatheringPointCost,
        }),
        { progress: 0, quality: 0, gpUsed: 0 },
    ), [usedActions, stats])

    const maxGP = stats?.gatheringPoints ?? 0
    const progressMet = totals.progress >= recipe.progressRequirement

    const rarities = useMemo(() => {
        const inputs = requiredResources.map((r) => ({
            amount: r.amount,
            tier: selectedResources.find((s) => s.resource.id === r.resourceId)?.rarity.tier ?? 1,
        }))
        const craftableIds = new Set(selectedRecipe.stats.map((s) => s.rarityId))
        const craftable = Object.fromEntries(Object.entries(RARITIES).filter(([id]) => craftableIds.has(id)))
        return GameDataUtil.applyRarityMultiplier(
            craftableIds.size > 0 ? craftable : RARITIES,
            craftRarityMultiplier(totals.quality / recipe.qualityRequirement, inputs),
        )
    }, [requiredResources, selectedResources, selectedRecipe.stats, totals.quality, recipe.qualityRequirement])
    const oddsSum = CALCULATE_RARITIES_ODDS_SUM(rarities)

    const maxCrafts = useMemo(() => Math.max(0, Math.min(...requiredResources.map((r) => {
        const stack = selectedResources.find((s) => s.resource.id === r.resourceId)
        return stack ? Math.floor(stack.quantity / r.amount) : 0
    }))), [requiredResources, selectedResources])

    const [craftCountText, setCraftCountText] = useState('1')
    const [craftCount, setCraftCount] = useState<number | null>(1)

    function useAction(action: Action) {
        if (totals.gpUsed + action.gatheringPointCost > maxGP) {
            toast.warning("Not enough gathering points for this action!", { duration: 1500 })
            return
        }
        const gpLeft = maxGP - totals.gpUsed - action.gatheringPointCost
        const progressAfter = totals.progress + action.progressMultiplier * (stats?.progress ?? 0)
        const cheapest = Math.min(...actions.map((a) => a.gatheringPointCost))

        if (gpLeft < cheapest && progressAfter < recipe.progressRequirement) {
            toast.error("Failed", { duration: 1500 })
            setUsedActions([])
            return
        }
        setUsedActions((prev) => [...prev, action])
    }

    async function start() {
        if (!craftCount) return
        try {
            await startCraftTask(
                recipe.id,
                craftCount,
                usedActions.map((a) => a.id),
                selectedResources.map((s) => ({ resourceId: s.resource.id, rarityId: s.rarity.id })),
            )
            toast.success(`Started crafting ${recipe.name}`, { duration: 1500 })
            onStarted()
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }

    return (
        <View className='gap-3'>
            <Card className='gap-2'>
                <ProgressBar
                    value={totals.progress}
                    max={recipe.progressRequirement}
                    showValue
                    label='Progress'
                    size="sm"
                    variant={progressMet ? "success" : "primary"}
                    formatValue={(v, m) => `${v} / ${m}`}
                />
                <ProgressBar
                    value={totals.quality}
                    max={recipe.qualityRequirement}
                    showValue
                    label='Quality'
                    size="sm"
                    variant={totals.quality >= recipe.qualityRequirement ? "success" : "primary"}
                    formatValue={(v, m) => `${v} / ${m}`}
                />
                <ProgressBar
                    value={maxGP - totals.gpUsed}
                    max={maxGP}
                    showValue
                    label='Gathering Points'
                    size="sm"
                    formatValue={(v, m) => `${v} / ${m} GP`}
                />
            </Card>
            <View className='gap-1'>
                <Text className="text-textSecondary text-sm">Odds</Text>
                <ScrollView
                    className="max-h-20"
                    contentContainerClassName="flex-row flex-wrap gap-2 justify-between"
                    showsVerticalScrollIndicator={false}
                    nestedScrollEnabled
                >
                    {Object.entries(rarities).map(([id, item]) => (
                        <View key={id} className='flex-row items-center gap-1.5'>
                            <View className='w-3 h-3 rounded-md' style={{ backgroundColor: item.color }} />
                            <Text className="text-textSecondary text-xs">
                                {GameDataUtil.roundToSignificant(item.odds / oddsSum * 100)}%
                            </Text>
                        </View>
                    ))}
                </ScrollView>
            </View>
            <View className='gap-1'>
                <Text className="text-textSecondary text-sm">Actions</Text>
                <FlatList
                    data={actions}
                    scrollEnabled={false}
                    keyExtractor={(action) => action.id}
                    ItemSeparatorComponent={() => <View className="h-2" />}
                    renderItem={({ item }) => (
                        <Card
                            className="gap-0.5 flex-row items-center justify-between p-1 px-2 rounded-md"
                            onPress={() => useAction(item)}
                            variant="default"
                        >
                            <View>
                                <Text className="text-textSecondary text-sm">{item.name}</Text>
                                <Text className="text-textMuted text-xs">
                                    Quality {item.qualityMultiplier * (stats?.quality ?? 0)}, Progress {item.progressMultiplier * (stats?.progress ?? 0)}
                                </Text>
                            </View>
                            <Text className="text-primary">GP: {item.gatheringPointCost}</Text>
                        </Card>
                    )}
                />
            </View>
            <View className='gap-1'>
                <Text className="text-textSecondary text-sm">Rotation</Text>
                {usedActions.length !== 0 ?
                    <ScrollView
                        className="max-h-20"
                        contentContainerClassName="flex-row flex-wrap gap-2"
                        showsVerticalScrollIndicator={false}
                        nestedScrollEnabled
                    >
                        {usedActions.map((action, index) => (
                            <Text
                                key={`${index}-${action.id}`}
                                className="grow text-center text-textMuted text-xs bg-surfaceRaised px-2 rounded-md"
                            >
                                {index + 1}. {action.name}
                            </Text>
                        ))}
                    </ScrollView> :
                    <Text className="text-textMuted text-xs">Select an action...</Text>
                }
            </View>
            <TextBox
                label={`Craft count (max ${maxCrafts})`}
                numeric
                min={1}
                max={Math.max(1, maxCrafts)}
                value={craftCountText}
                onChangeText={setCraftCountText}
                onChangeNumber={setCraftCount}
            />
            <View className='flex-row gap-2'>
                <Button title='Back' size='sm' variant="secondary" className='flex-1' onPress={onBack} />
                <Button title='Reset' size='sm' variant="secondary" className='flex-1' onPress={() => setUsedActions([])} />
                <Button
                    title='Start'
                    size='sm'
                    className='flex-[2]'
                    loading={starting}
                    disabled={starting || inventoryFull || !progressMet || !craftCount || craftCount > maxCrafts}
                    onPress={start}
                />
            </View>
            {inventoryFull && (
                <Text className="text-danger text-xs text-center">Inventory full: sell items to start a task</Text>
            )}
        </View>
    )
}
