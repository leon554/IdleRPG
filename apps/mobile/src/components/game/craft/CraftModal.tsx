import { View, Text } from 'react-native'
import { useState } from 'react'
import { Modal } from '../../primitives/Modal'
import type { Action, Recipe, ResourceStack } from '@idlerpg/shared'
import { Button } from '../../primitives/Button'
import ResourceSelectionCard from './ResourceSlectionCard'
import RotationSelectionCard from './RotationSelectionCard'

interface Props{
    openModal: boolean
    setOpenModal: (open: boolean) => void
    categoryId: string
    selectedRecipe: Recipe
}

export default function CraftModal({openModal, setOpenModal, selectedRecipe}: Props) {
    const [selectedResources, setSelectedResources] = useState<ResourceStack[]>([])
    const [enoughResources, setEnoughResources] = useState(false)
    const [usedActions, setUsedActions] = useState<Action[]>([])

    const [currentPage, setCurrentPage] = useState<"ResourceSelection" | "RotationSelection">("ResourceSelection")

    return (
        <Modal visible={openModal} onClose={() => setOpenModal(false)} className='gap-3'>
            <Text className="text-textPrimary text-lg font-medium">{selectedRecipe.recipe.name}</Text>
            {currentPage == "ResourceSelection" && <>
                <ResourceSelectionCard
                    selectedRecipe={selectedRecipe}
                    selectedResources={selectedResources}
                    setSelectedResources={setSelectedResources}
                    setEnoughResources={setEnoughResources}
                />
                <View className='flex-row w-full justify-end'>
                    <Button
                        title='Next'
                        size='sm'
                        disabled={!enoughResources}
                        onPress={() => setCurrentPage("RotationSelection")}
                    />
                </View>
            </>}
            {currentPage == "RotationSelection" &&
                <RotationSelectionCard
                    selectedRecipe={selectedRecipe}
                    selectedResources={selectedResources}
                    usedActions={usedActions}
                    setUsedActions={setUsedActions}
                    onBack={() => setCurrentPage("ResourceSelection")}
                    onStarted={() => setOpenModal(false)}
                />
            }
        </Modal>
    )
}
