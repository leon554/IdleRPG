import { View, Text, FlatList, ScrollView } from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../primitives/Modal'
import { Card } from '../primitives/Card'
import { useStore } from '@/lib/store'
import { staticDataStore } from '@/stores/staticData'
import { statsStore } from '@/stores/stats'
import { startGatherTask, taskStore } from '@/stores/task'
import { errorMessage } from '@/lib/api-service-layer/errors'
import { ProgressBar } from '../primitives/ProgressBar'
import { Action, GatheringGroup, Recipe, ResourceStack} from '@idlerpg/shared'
import { RARITIES, CALCULATE_RARITIES_ODDS_SUM } from '@idlerpg/shared/src/gameData'
import { Button } from '../primitives/Button'
import { toast } from '../primitives/Toast'
import { GameDataUtil } from '@/util/game-data-util'
import { inventoryStore } from '@/stores/inventory'
import { colors } from '@/theme'

interface Props{
    openModal: boolean
    setOpenModal: (open: boolean) => void
    categoryId: string
    selectedRecipe: Recipe
}

export default function CraftModal({openModal, setOpenModal, categoryId, selectedRecipe}: Props) {
    const invetory = useStore(inventoryStore, i => i.inventory?.resources) ?? []

    const requiredResources = useMemo(() => new Set(selectedRecipe.requiredResources.map(r => r.resourceId)), [])
    const releventResources = useMemo(() => invetory.filter(i => requiredResources.has(i.resource.id)),[invetory])
    
    const [selectedResources, setSelectedResources] = useState<ResourceStack[]>([])
    const enoughResources = useMemo(() => selectedRecipe.requiredResources.every(r => findMatchingSelectedResourceAmt(r.resourceId) >= r.amount), [selectedResources])


    function addResource(resource: ResourceStack){
        const prev = selectedResources.find(r => r.resource.id == resource.resource.id)
        if(prev) setSelectedResources(prev => [...prev.filter(p => p.resource.id != resource.resource.id)])
        setSelectedResources(prev => [...prev, resource])
    }

    function findMatchingSelectedResourceAmt(resourceId: string){
        const matchingResource = selectedResources.find(r => r.resource.id == resourceId)
        if(!matchingResource) return 0
        return matchingResource.quantity
    }

    return (
        <Modal visible={openModal} onClose={() => setOpenModal(false)} className='gap-3'>
            <Text className="text-textPrimary text-lg font-medium">{selectedRecipe.recipe.name}</Text>
                <FlatList
                    horizontal
                    data={selectedRecipe.requiredResources}
                    keyExtractor={(item) => String(item.resourceId)}
                    contentContainerStyle={{ gap: 10 }}
                    renderItem={({ item }) => {
                        const selectedAmt =  findMatchingSelectedResourceAmt(item.resourceId)

                        return(
                            <View className=''>
                                <Text className="text-xs w-fit text-textMuted rounded-md"
                                    style={{color: selectedAmt >= item.amount ? colors.success : ""}}
                                >
                                    {item.name} {selectedAmt}/{item.amount}
                                </Text>
                            </View>
                        )
                    }
                    }
                />
                <FlatList
                    data={releventResources}
                    keyExtractor={(item) => String(item.quantity + item.resource.id + item.rarity.id)}
                    contentContainerStyle={{ gap: 10 }}
                    renderItem={({ item }) => (
                        <Card className={`flex-row items-center gap-1.5 p-2`}
                            onPress={() => {addResource(item)}}
                            style={{borderColor:  selectedResources.some(r => r.rarity.id == item.rarity.id && r.resource.id == item.resource.id) ?
                            colors.primary : ""
                        }}
                        >
                            <View className="w-3 h-3 rounded-md" style={{ backgroundColor: item.rarity.color }} />
                            <Text className="text-xs w-fit text-textMuted rounded-md">
                                {item.resource.itemName}
                            </Text>
                            <Text className="text-xs w-fit text-textMuted rounded-md">
                                {GameDataUtil.formatCompactNumber(item.quantity)}
                            </Text>
                        </Card>
                    )}
                />
                <View className='flex-row w-full justify-end'>
                    <Button
                        title='Next'
                        size='sm'
                        disabled={!enoughResources}
                    />
                </View>
        </Modal>
    )
}