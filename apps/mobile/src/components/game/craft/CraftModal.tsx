import { View, Text, FlatList} from 'react-native'
import { useMemo, useState } from 'react'
import { Modal } from '../../primitives/Modal'
import { Card } from '../../primitives/Card'
import { useStore } from '@/lib/store'
import { Recipe, ResourceStack} from '@idlerpg/shared'
import { Button } from '../../primitives/Button'
import { GameDataUtil } from '@/util/game-data-util'
import { inventoryStore } from '@/stores/inventory'
import { colors } from '@/theme'
import ResourceSelectionCard from './ResourceSlectionCard'

interface Props{
    openModal: boolean
    setOpenModal: (open: boolean) => void
    categoryId: string
    selectedRecipe: Recipe
}

export default function CraftModal({openModal, setOpenModal, categoryId, selectedRecipe}: Props) {
    const [selectedResources, setSelectedResources] = useState<ResourceStack[]>([])
    const [enoughResources, setEnoughResources] = useState(false)

    const [currentPage, setCurrentPage] = useState<"ResourceSelection" | "RotationSelection">("ResourceSelection")

    function handleNextPress(){
        if(currentPage == "ResourceSelection"){
            setCurrentPage("RotationSelection")
        }
    }

    return (
        <Modal visible={openModal} onClose={() => setOpenModal(false)} className='gap-3'>
            <Text className="text-textPrimary text-lg font-medium">{selectedRecipe.recipe.name}</Text>
            {currentPage == "ResourceSelection" && 
                <ResourceSelectionCard 
                    selectedRecipe={selectedRecipe} 
                    selectedResources={selectedResources} 
                    setSelectedResources={setSelectedResources}
                    setEnoughResources={setEnoughResources}
                />
            }
            <View className='flex-row w-full justify-end'>
                <Button
                    title='Next'
                    size='sm'
                    disabled={!enoughResources}
                    onPress={() => handleNextPress()}
                />
            </View>
        </Modal>
    )
}