import { FlatList, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { GatheringGroup } from '@idlerpg/shared';
import { Screen } from '@/components/primitives/Screen';
import PageHeader from '@/components/primitives/PageHeader';
import { useStore } from '@/lib/store';
import { staticDataStore } from '@/stores/staticData';
import { useState } from 'react';
import GatherModal from '@/components/game/gathering/GatherModal';
import { CategoryProgressCard } from '@/components/game/CategoryProgressCard';
import { SegmentedControl } from '@/components/primitives/SegmentedControl';
import { EquipmentTab } from '@/components/game/equipment/EquipmentTab';
import GatheringGroupCard from '@/components/game/gathering/GatheringGroupCard';

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
            <SegmentedControl
                options={[{ value: "gather", label: "Gather" }, { value: "equipment", label: "Equipment" }]}
                value={tab}
                onChange={setTab}
            />
            <CategoryProgressCard categoryId={category} />
            {tab === "equipment" && <EquipmentTab categoryId={category} />}
            {tab === "gather" && <FlatList
                data={ggs}
                keyExtractor={(gg) => String(gg.id)}
                contentContainerStyle={{ gap: 12 }}
                renderItem={({ item }) => (
                   <GatheringGroupCard gatheringGroup={item} setSelectedGatheringGroup={setSelectedGatheringGroup}/>
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