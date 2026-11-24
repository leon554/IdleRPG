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
import RecipeCard from '@/components/game/craft/RecipeCard';

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
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <RecipeCard recipe={item} setSelectedRecipe={setSelectedRecipe}/>
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