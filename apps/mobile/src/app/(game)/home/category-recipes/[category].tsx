import { FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { GatheringGroup, Recipe } from '@idlerpg/shared';
import { Screen } from '@/components/primitives/Screen';
import PageHeader from '@/components/primitives/PageHeader';
import { Card } from '@/components/primitives/Card';
import { useStore } from '@/lib/store';
import { staticDataStore } from '@/stores/staticData';
import { View } from 'react-native';
import { capitliseFirst } from '@/auth/util';
import { rarityColors } from '@/theme';
import { Button } from '@/components/primitives/Button';
import { useState } from 'react';
import CraftModal from '@/components/game/craft/CraftModal';
import { CategoryProgressCard } from '@/components/game/CategoryProgressCard';
import { SegmentedControl } from '@/components/primitives/SegmentedControl';
import { EquipmentTab } from '@/components/game/equipment/EquipmentTab';

export default function ReipeScreen() {
    const { category } = useLocalSearchParams<{ category: string }>();
    const recipes = useStore(staticDataStore, (s) => s.recipes[category]) ?? [];

    const [selectedRecipe, setSelectedRecipe] = useState<null | Recipe>(null)
    const [tab, setTab] = useState<"recipes" | "equipment">("recipes")


    return (
        <Screen className="gap-4">
            <PageHeader name={capitliseFirst(category)} onPrev={() => {router.replace("/(game)/home/crafting")}}/>
            <CategoryProgressCard categoryId={category} />
            <SegmentedControl
                options={[{ value: "recipes", label: "Recipes" }, { value: "equipment", label: "Equipment" }]}
                value={tab}
                onChange={setTab}
            />
            {tab === "equipment" && <EquipmentTab categoryId={category} />}
            {tab === "recipes" && <FlatList
                data={recipes}
                keyExtractor={(recipe) => recipe.recipe.id}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                    <Card className='gap-2'>
                        <View className='gap-2'>
                            <View className='flex-col'>
                                <Text className="text-textPrimary text-lg font-medium">
                                    {item.recipe.name}
                                    {item.recipe.outputQuantity > 1 && <Text className="text-textMuted text-sm"> ×{item.recipe.outputQuantity}</Text>}
                                </Text>
                                <FlatList
                                    horizontal
                                    data={item.stats}
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
                            <View className='flex-row gap-2'>
                                <Text className="text-xs bg-primary w-fit text-onPrimary px-2 rounded-md mt-0.5">
                                    Lvl Required: {item.recipe.levelRequirement}
                                </Text>
                            </View>
                        </View>
                        <View>
                            <FlatList
                                horizontal
                                data={item.requiredResources}
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
                        <Button
                            title='Craft'
                            size='sm'
                            onPress={() => setSelectedRecipe(item)}
                        />
                    </Card>
                )}
            />
            }
            {selectedRecipe != null && 
                <CraftModal 
                    openModal={true}
                    setOpenModal={() => setSelectedRecipe(null)}
                    categoryId={selectedRecipe.categoryId}
                    selectedRecipe={selectedRecipe}
                />}
        </Screen>
    );
}