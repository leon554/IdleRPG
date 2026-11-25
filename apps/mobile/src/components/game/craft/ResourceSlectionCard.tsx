import { View, Text, FlatList} from 'react-native'
import { useEffect, useMemo, useState } from 'react'
import { Modal } from '../../primitives/Modal'
import { Card } from '../../primitives/Card'
import { useStore } from '@/lib/store'
import { Recipe, ResourceStack} from '@idlerpg/shared'
import { Button } from '../../primitives/Button'
import { GameDataUtil } from '@/util/game-data-util'
import { inventoryStore } from '@/stores/inventory'
import { colors } from '@/theme'
import type { Dispatch, SetStateAction } from 'react'

interface Props{
    selectedRecipe: Recipe
    selectedResources: ResourceStack[]
    setSelectedResources: Dispatch<SetStateAction<ResourceStack[]>>
    setEnoughResources: Dispatch<SetStateAction<boolean>>
}

export default function ResourceSelectionCard({selectedRecipe, selectedResources, setSelectedResources, setEnoughResources}: Props) {
    const invetory = useStore(inventoryStore, i => i.inventory?.resources) ?? []

    const requiredResources = useMemo(() => new Set(selectedRecipe.requiredResources.map(r => r.resourceId)), [])
    const releventResources = useMemo(() => invetory.filter(i => requiredResources.has(i.resource.id)),[invetory])
    
    useEffect(() => {
        setEnoughResources(selectedRecipe.requiredResources.every(r => findMatchingSelectedResourceAmt(r.resourceId) >= r.amount))
    }, [selectedResources])

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
        <View className='gap-2'>
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
                }}
            />
            <FlatList
                data={releventResources}
                keyExtractor={(item) => `${item.resource.id}:${item.rarity.id}`}
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
        </View>
    )
}