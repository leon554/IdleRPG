import { View, Text, FlatList, ScrollView } from 'react-native'
import { useEffect, useState } from 'react'
import { Modal } from '../primitives/Modal'
import { Card } from '../primitives/Card'
import { useStore } from '@/lib/store'
import { staticDataStore } from '@/stores/staticData'
import { statsStore } from '@/stores/stats'
import { ProgressBar } from '../primitives/ProgressBar'
import { Action, GatheringGroup} from '@idlerpg/shared'
import { RARITIES, CALCULATE_RARITIES_ODDS_SUM } from '@idlerpg/shared/src/gameData'
import { Button } from '../primitives/Button'
import { toast } from '../primitives/Toast'
import { GameDataUtil } from '@/util/game-data-util'

interface Props{
    openModal: boolean
    setOpenModal: (open: boolean) => void
    categoryId: string
    selectedGatheringGroup: GatheringGroup
}

export default function GatherModal({openModal, setOpenModal, categoryId, selectedGatheringGroup}: Props) {
    const actions = useStore(staticDataStore, (s) => s.actions);
    const stats = useStore(statsStore, s => s.stats[categoryId])
    const [progress, setProgress] = useState({
        progress: 0,
        quality: 0,
        yield: 0
    })

    const [usedGP, setUsedGP] = useState(0)
    const [usedActions, setUsedActions] = useState<Action[]>([])
    const rarities = GameDataUtil.applyRarityMultiplier(RARITIES, (progress.quality/selectedGatheringGroup.mainResource.qualityRequirement))

    useEffect(() => {
        if(usedGP >= stats.gatheringPoints && progress.progress < selectedGatheringGroup.mainResource.progressRequirement){
            toast.error("Failed", {duration: 1500})
            reset()
            return
        }

    }, [usedGP])

    function reset(){
        setProgress({
            progress: 0,
            quality: 0,
            yield: 0
        })
        setUsedActions([])
        setUsedGP(0)
    }

    function calculateYieldMultiplie(){
        return `${Math.floor((progress.yield/selectedGatheringGroup.mainResource.yieldRequirement)/0.25)}`
    }

    function useAction(item: Action){
        if(usedGP + item.gatheringPointCost > stats.gatheringPoints){
            toast.warning("Not enough gathering points for this action!", {duration: 1500})
            return
        }
        setUsedGP(p => p += item.gatheringPointCost)
        setProgress(p => ({
            progress: p.progress + item.progressMultiplier * stats.progress,
            quality: p.quality + item.qualityMultiplier * stats.quality,
            yield: p.yield + item.yieldMultiplier * stats.yield
        }))
        setUsedActions(p => [...p, item])
    }
    

    return (
        <Modal visible={openModal} onClose={() => setOpenModal(false)} className='gap-3'>
            <Text className="text-textPrimary text-lg font-medium">Actions</Text>
            <Card className='gap-2'>
                <ProgressBar 
                    value={progress.progress} 
                    max={selectedGatheringGroup.mainResource.progressRequirement} 
                    showValue 
                    label='Progress'
                    size="sm"
                    variant={progress.progress >= selectedGatheringGroup.mainResource.progressRequirement ? "success" : "primary"}
                    formatValue={(v, m) => `${v} / ${m}`}
                />
                <ProgressBar 
                    value={progress.quality} 
                    max={selectedGatheringGroup.mainResource.qualityRequirement} 
                    showValue 
                    label='Quality'
                    size="sm"
                    variant={progress.quality >= selectedGatheringGroup.mainResource.qualityRequirement ? "success" : "primary"}
                    formatValue={(v, m) => `${v} / ${m}`}
                />
                <ProgressBar 
                    value={progress.yield} 
                    max={selectedGatheringGroup.mainResource.yieldRequirement} 
                    showValue 
                    label={`Yield ${calculateYieldMultiplie()}x`}
                    size="sm"
                    variant={progress.yield >= selectedGatheringGroup.mainResource.yieldRequirement ? "success" : "primary"}
                    formatValue={(v, m) => `${v} / ${m}`}
                />
                <ProgressBar 
                    value={(stats?.gatheringPoints ?? 0) - usedGP} 
                    max={stats?.gatheringPoints ?? 0} 
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
                    {Object.values(rarities).map((item) => (
                         <View className='flex-row items-center gap-1.5'>
                            <View className='w-3 h-3 rounded-md' style={{backgroundColor: `${item.color}`}}>

                            </View>
                            <Text className="text-textSecondary text-xs">
                                {GameDataUtil.roundToSignificant(item.odds/CALCULATE_RARITIES_ODDS_SUM(rarities)*100)}%
                            </Text>
                        </View>
                    ))}
                </ScrollView> 
            </View>
            <View className='gap-1'>
                <Text className="text-textSecondary text-sm">Actions</Text>
                <FlatList
                    data={actions}
                    keyExtractor={(action) => action.id}
                    ItemSeparatorComponent={() => <View className="h-2" />}
                    renderItem={({ item }) => (
                        <Card className="gap-0.5 flex-row items-center justify-between p-1 px-2 rounded-md"
                            onPress={() => useAction(item)}
                            variant="default"
                        >
                            <View>
                                <Text className="text-textSecondary text-sm">{item.name}</Text>
                                <Text className="text-textMuted text-xs">
                                    Yield {item.yieldMultiplier * stats.yield}, Quality {item.qualityMultiplier * stats.quality}, Progress: {item.progressMultiplier * stats.progress}
                                </Text>
                            </View>
                            <Text className="text-primary">GP: {item.gatheringPointCost}</Text>
                        </Card>
                    )}
                />
            </View>
            <View className='gap-1'>
                <Text className="text-textSecondary text-sm">Rotation</Text>
                <Card>
                    {usedActions.length != 0 ?
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
                </Card>
            </View>
            <View className='flex-row gap-3'>
                <Button
                    title='Reset'
                    size='sm'
                    variant="secondary"
                    className='w-[30%]'
                    onPress={() => reset()}
                />
                <Button
                    title='Start'
                    size='sm'
                    className='w-[67%]'
                />
            </View>
        </Modal>
    )
}