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
import { progressStore } from '@/stores/progress';
import { ProgressBar } from '@/components/primitives/ProgressBar';
import { GameDataUtil } from '@/util/game-data-util';
import { MAX_LEVEL, xpForLevel } from '@idlerpg/shared/src/gameData';

export default function CategoryScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const ggsForCategory = useStore(staticDataStore, (s) => s.ggPerCategory[category]);

    const progress = useStore(progressStore, (p) => p.progress[category]) ?? { categoryId: category, level: 1, xp: 0 }
    const levelStartXp = xpForLevel(progress.level)
    const nextLevelXp = xpForLevel(progress.level + 1)
    const maxed = progress.level >= MAX_LEVEL

    const [selectedGatheringGroup, setSelectedGatheringGroup] = useState<GatheringGroup | null>(null)

    const ggs = ggsForCategory ?? [];
    const name = ggs[0]?.category ?? "Unknown category";

    return (
        <Screen className="gap-3">
            <PageHeader name={name} onPrev={() => {router.replace("/(game)/home/gathering")}}/>
            <Card className="gap-2">
                <View className="flex-row justify-between items-center">
                    <Text className="text-textPrimary font-semibold">Level {progress.level}</Text>
                    <Text className="text-textMuted text-xs">{GameDataUtil.formatCompactNumber(progress.xp)} XP</Text>
                </View>
                <ProgressBar
                    value={maxed ? 1 : progress.xp - levelStartXp}
                    max={maxed ? 1 : nextLevelXp - levelStartXp}
                    size="sm"
                    label={maxed ? "Max level" : `Next level In: ${GameDataUtil.formatCompactNumber(nextLevelXp - progress.xp)} XP`}
                />
            </Card>
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
                                onPress={() => setSelectedGatheringGroup(item)}
                            />
                        </View>
                    </Card>
                )}
            />
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