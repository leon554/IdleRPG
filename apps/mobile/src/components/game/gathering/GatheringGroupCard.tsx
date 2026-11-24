import { View, Text, FlatList} from 'react-native'
import { Card } from '@/components/primitives/Card'
import { Button } from '@/components/primitives/Button'
import { GatheringGroup } from '@idlerpg/shared'
import { Dispatch, SetStateAction } from 'react'
import { useStore } from '@/lib/store'
import { statsStore } from '@/stores/stats'
import { progressStore } from '@/stores/progress'
import { colors } from '@/theme'
import { toast } from '@/components/primitives/Toast'

interface Props{
    gatheringGroup: GatheringGroup
    setSelectedGatheringGroup: Dispatch<SetStateAction<GatheringGroup | null>>
}

export default function GatheringGroupCard({gatheringGroup, setSelectedGatheringGroup}: Props) {
    const progress = useStore(progressStore, p => p.progress[gatheringGroup.categoryId])
    const unlocked = gatheringGroup.levelRequirement == 1 ? 
        true : progress ? progress.level >= gatheringGroup.levelRequirement : false
    

    function handlePress(){
        if(!unlocked){
            toast.warning(`Reach level ${gatheringGroup.levelRequirement} to start gathering`, {duration: 800})
            return
        }
        setSelectedGatheringGroup(gatheringGroup)
    }

    return (
        <Card className="gap-2"
            onPress={() => handlePress()}
        >
            <View className='gap-1'>
                <View className='flex-row items-center gap-2'>
                    <Text className='bg-primary p-1 rounded-md font-bold font-mono text-xs'
                        style={{
                            backgroundColor: unlocked ? colors.primary : colors.surfaceRaised,
                            color: unlocked ? colors.onPrimary : colors.textSecondary
                        }}
                    >
                        {gatheringGroup.mainResource.itemName.slice(0, 2).toUpperCase()}
                    </Text>
                    <Text className="text-textPrimary text-lg font-medium"
                        style={{
                            color: unlocked ? colors.textPrimary : colors.textSecondary
                        }}
                    >
                        {gatheringGroup.mainResource.itemName}
                    </Text>
                    <Text className="text-textMuted text-xs font-medium">
                        Lv {gatheringGroup.levelRequirement}
                    </Text>
                </View>
                {gatheringGroup.secondaryResources.length > 0 &&
                    <FlatList
                        horizontal
                        data={gatheringGroup.secondaryResources}
                        keyExtractor={(gg) => String(gg.resource.itemName)}
                        contentContainerStyle={{ gap: 12 }}
                        renderItem={({ item }) => (
                            <View className='flex-row gap-0.5'>
                                <Text className="text-textMuted text-xs">{item.resource.itemName}: </Text>
                                <Text className="text-textMuted text-xs ">{item.dropChance * 100}%</Text>
                            </View>
                        )}
                    />
                }
            </View>
        </Card>
    )
}