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
import GatherModal from '@/components/game/GatherModal';
import { CategoryProgressCard } from '@/components/game/CategoryProgressCard';
import { SegmentedControl } from '@/components/primitives/SegmentedControl';
import { EquipmentTab } from '@/components/game/equipment/EquipmentTab';

export default function CategoryScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const ggsForCategory = useStore(staticDataStore, (s) => s.ggPerCategory[category]);

    const [selectedGatheringGroup, setSelectedGatheringGroup] = useState<GatheringGroup | null>(null)
    const [tab, setTab] = useState<"gather" | "equipment">("gather")

    const ggs = ggsForCategory ?? [];
    const name = ggs[0]?.category ?? "Unknown category";

    return (
        <Screen className="gap-3">
            <PageHeader name={name} onPrev={() => {router.replace("/(game)/home/gathering")}}/>
            <CategoryProgressCard categoryId={category} />
            <SegmentedControl
                options={[{ value: "gather", label: "Gather" }, { value: "equipment", label: "Equipment" }]}
                value={tab}
                onChange={setTab}
            />
            {tab === "equipment" && <EquipmentTab categoryId={category} />}
            {tab === "gather" && <FlatList
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
                                onPress={() => setSelectedGatheringGroup(item)}
                            />
                        </View>
                    </Card>
                )}
            />
            }
            {selectedGatheringGroup && (
                <GatherModal
                    key={selectedGatheringGroup.id}
                    openModal
                    setOpenModal={(open) => {
                        if (!open) setSelectedGatheringGroup(null)
                    }}
                    categoryId={category}
                    selectedGatheringGroup={selectedGatheringGroup}
                />
            )}
        </Screen>
    );
}