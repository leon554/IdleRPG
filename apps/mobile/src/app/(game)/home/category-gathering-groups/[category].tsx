import { FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { GatheringGroup } from '@idlerpg/shared';
import { Screen } from '@/components/primitives/Screen';
import PageHeader from '@/components/primitives/PageHeader';
import { Card } from '@/components/primitives/Card';
import { useGameData } from '@/providers/StaticGameDataProvider';
import { View } from 'react-native';

export default function CategoryScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const gameData = useGameData();

    const ggs = gameData?.ggPerCategory[category] ?? [];
    const name = ggs[0]?.category ?? "Unknown category";

    return (
        <Screen className="gap-4">
            <PageHeader name={name} onPrev={() => {router.replace("/(game)/home/gathering")}}/>
            <FlatList
                data={ggs}
                keyExtractor={(gg) => String(gg.id)}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                    <Card className='gap-4'>
                        <View className='gap-0.5'>
                            <Text className="text-textPrimary text-lg font-medium">{item.mainResource.itemName}</Text>
                            <View className='flex-row gap-2'>
                                <Text className="text-xs bg-primary w-fit text-onPrimary px-2 rounded-md mt-0.5">
                                    Progress {item.mainResource.progressRequirement}{" "}
                                </Text>
                                <Text className="text-xs bg-primary w-fit text-onPrimary px-2 rounded-md mt-0.5">
                                    Quality {item.mainResource.qualityRequirement}{" "}
                                </Text>
                                <Text className="text-xs bg-primary w-fit text-onPrimary px-2 rounded-md mt-0.5">
                                    Yield {item.mainResource.yieldRequirement}
                                </Text>
                            </View>
                        </View>
                        {item.secondaryResources.length > 0 &&
                            <FlatList
                                horizontal
                                data={item.secondaryResources}
                                keyExtractor={(gg) => String(gg.resource.itemName)}
                                contentContainerStyle={{ gap: 12 }}
                                renderItem={({ item }) => (
                                    <View className='flex-row gap-0.5'>
                                        <Text className="text-textMuted text-sm">{item.resource.itemName}: </Text>
                                        <Text className="text-textMuted text-sm ">{item.dropChance * 100}%</Text>
                                    </View>
                                )}
                            />
                        }
                    </Card>
                )}
            />
        </Screen>
    );
}