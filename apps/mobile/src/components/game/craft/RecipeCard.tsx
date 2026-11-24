import { View, Text, FlatList } from 'react-native'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { Recipe } from '@idlerpg/shared'
import { Dispatch, SetStateAction } from 'react'
import { rarityColors } from '@/theme'
import { useStore } from '@/lib/store'
import { progressStore } from '@/stores/progress'
import { colors } from '@/theme'
import { toast } from '@/components/primitives/Toast'

interface Props{
    recipe: Recipe
    setSelectedRecipe: Dispatch<SetStateAction<Recipe | null>>
}

export default function RecipeCard({recipe, setSelectedRecipe}: Props) {
    const progress = useStore(progressStore, p => p.progress[recipe.categoryId])
    const unlocked = recipe.recipe.levelRequirement == 1 ? 
        true : progress ? progress.level >= recipe.recipe.levelRequirement : false


    function handlePress(){
        if(!unlocked){
            toast.warning(`Reach level ${recipe.recipe.levelRequirement} to start gathering`, {duration: 800})
            return
        }
        setSelectedRecipe(recipe)
    }

    return (
        <Card className='gap-2'
            onPress={() => handlePress()}
        >
            <View className='gap-2'>
                <View className='flex-row items-center gap-2'>
                    <Text className='bg-primary p-1 rounded-md font-bold font-mono text-xs'
                        style={{
                            backgroundColor: unlocked ? colors.primary : colors.surfaceRaised,
                            color: unlocked ? colors.onPrimary : colors.textSecondary
                        }}
                    >
                        {(recipe.outputResource?.itemName ?? recipe.outputEquipment?.name ?? "").slice(0, 2).toUpperCase()}
                    </Text>
                    <Text className="text-textPrimary text-lg font-medium"
                        style={{
                            color: unlocked ? colors.textPrimary : colors.textSecondary
                        }}
                    >
                        {recipe.outputResource?.itemName ?? recipe.outputEquipment?.name}
                    </Text>
                    <Text className="text-textMuted text-xs font-medium">
                        Lv {recipe.recipe.levelRequirement}
                    </Text>
                </View>
                {recipe.outputEquipment &&
                    <View className='flex-col'>
                        <FlatList
                            horizontal
                            data={recipe.stats}
                            keyExtractor={(item) => String(item.rarityId)}
                            contentContainerStyle={{ gap: 4 }}
                            renderItem={({ item }) => (
                                <View 
                                    className={`flex-row gap-0.5 w-2 h-2 rounded-full`} 
                                    style={{backgroundColor: rarityColors[item.rarityId as keyof typeof rarityColors]}}>
                                </View>
                            )}
                        />
                    </View>
                }
                <View>
                    <FlatList
                        horizontal
                        data={recipe.requiredResources}
                        keyExtractor={(item) => String(item.resourceId)}
                        contentContainerStyle={{ gap: 10 }}
                        renderItem={({ item }) => (
                            <View className=''>
                                <Text className="text-xs w-fit text-textMuted rounded-md">
                                    {item.name} x{item.amount}
                                </Text>
                            </View>
                        )}
                    />
                </View>
            </View>
        </Card>
    )
}