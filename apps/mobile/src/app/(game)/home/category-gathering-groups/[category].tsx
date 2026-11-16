import { FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { GatheringGroup } from '@idlerpg/shared';
import { Screen } from '@/components/primitives/Screen';
import PageHeader from '@/components/primitives/PageHeader';
import { Card } from '@/components/primitives/Card';
import { useStore } from '@/lib/store';
import { staticDataStore } from '@/stores/staticData';
import { View } from 'react-native';
import { Button } from '@/components/primitives/Button';
import { useState } from 'react';
import { Modal } from '@/components/primitives/Modal';

export default function CategoryScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const ggsForCategory = useStore(staticDataStore, (s) => s.ggPerCategory[category]);
    const actions = useStore(staticDataStore, (s) => s.actions);

    const [openModal, setOpenModal] = useState(false)

    const ggs = ggsForCategory ?? [];
    const name = ggs[0]?.category ?? "Unknown category";

    return (
        <Screen className="gap-4">
            <PageHeader name={name} onPrev={() => {router.replace("/(game)/home/gathering")}}/>
            <FlatList
                data={ggs}
                keyExtractor={(gg) => String(gg.id)}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                    <Card className='gap-2'>
                        <View className='gap-2'>
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
                                            <Text className="text-textMuted text-xs">{item.resource.itemName}: </Text>
                                            <Text className="text-textMuted text-xs ">{item.dropChance * 100}%</Text>
                                        </View>
                                    )}
                                />
                            }
                        </View>
                        <View className='w-full flex-row justify-end'>
                            <Button
                                title='Gather'
                                size="sm"
                                variant="primary"
                                onPress={() => setOpenModal(true)}
                            />
                        </View>
                        <Modal visible={openModal} onClose={() => setOpenModal(false)}>
                            <Text className="text-textPrimary text-lg font-medium mb-1">Actions</Text>
                            <FlatList
                                data={actions}
                                keyExtractor={(action) => action.id}
                                ItemSeparatorComponent={() => <View className="h-2" />}
                                renderItem={({ item }) => (
                                    <Card className="gap-0.5 flex-row items-center justify-between border p-1 px-2 rounded-md border-border"
                                        onPress={() => {}}
                                        variant="raised"
                                    >
                                        <View>
                                            <Text className="text-textSecondary text-sm">{item.name}</Text>
                                            <Text className="text-textMuted text-xs">
                                                Yield {item.yield}, Quality {item.quality}, Progress: {item.progress}
                                            </Text>
                                        </View>
                                        <Text className="text-primary">GP: {item.gatheringPointCost}</Text>
                                    </Card>
                                )}
                            />
                        </Modal>
                    </Card>
                )}
            />
        </Screen>
    );
}