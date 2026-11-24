import { useEffect, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import type { EquippedSlot } from "@idlerpg/shared";
import { Card } from "@/components/primitives/Card";
import { toast } from "@/components/primitives/Toast";
import { useStore } from "@/lib/store";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { equipmentStore, loadEquipment } from "@/stores/equipment";
import { statsStore } from "@/stores/stats";
import { taskStore } from "@/stores/task";
import { StatList } from "./StatList";
import { SlotPickerModal } from "./SlotPickerModal";

export function EquipmentTab({ categoryId }: { categoryId: string }) {
    const allSlots = useStore(equipmentStore, (s) => s.slots);
    const status = useStore(equipmentStore, (s) => s.status);
    const stats = useStore(statsStore, (s) => s.stats[categoryId]);
    const locked = useStore(taskStore, (s) => s.activeTask?.categoryId === categoryId);
    const [pickerSlotId, setPickerSlotId] = useState<string | null>(null);

    const slots = useMemo(() => allSlots.filter((s) => s.slot.categoryId === categoryId), [allSlots, categoryId]);
    const pickerSlot = slots.find((s) => s.slot.id === pickerSlotId) ?? null;

    useEffect(() => {
        if (status === "idle") loadEquipment().catch((error) => toast.error(errorMessage(error)));
    }, [status]);

    return (
        <ScrollView className="flex-1" contentContainerClassName="gap-3 pb-4" showsVerticalScrollIndicator={false}>
            {stats && (
                <Card className="gap-1.5">
                    <Text className="text-textPrimary font-medium text-sm">Total stats</Text>
                    <StatList stats={stats} />
                </Card>
            )}

           <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 9 }}>
                {slots.map((slot) => (
                    <View key={slot.slot.id} style={{ width: "49%" }}>
                        <SlotRow
                            slot={slot}
                            disabled={locked}
                            onPress={() => locked ? toast.warning("Can't change equipment while task is running",  {duration: 800}) : setPickerSlotId(slot.slot.id)}
                        />
                    </View>
                ))}
            </View>

            {status === "ready" && slots.length === 0 && (
                <Text className="text-textMuted text-xs text-center">This category has no gear slots.</Text>
            )}

            {pickerSlot && <SlotPickerModal equippedSlot={pickerSlot} onClose={() => setPickerSlotId(null)} />}
        </ScrollView>
    );
}

function SlotRow({ slot, disabled, onPress }: { slot: EquippedSlot; disabled: boolean; onPress: () => void }) {
    const { equipped } = slot;
    return (
        <Card className={`gap-1.5 h-20 ${disabled ? "opacity-60" : ""}`} onPress={onPress}>
            <View className="flex-row justify-between items-center">
                <Text className="text-textMuted text-xs">{slot.slot.name}</Text>
            </View>
            {equipped ? (
                <>
                    <View className="flex-row items-center gap-1.5 p-0.5 w-fit px-1.5 rounded-md" 
                        style={{backgroundColor: equipped.rarity.color}}
                    >
                        <Text className="font-medium text-onPrimary">{equipped.equipment.name}</Text>
                    </View>
                </>
            ) : (
                <Text className="text-textSecondary">Empty</Text>
            )}
        </Card>
    );
}
