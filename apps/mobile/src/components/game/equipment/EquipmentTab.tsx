import { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";
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
        <View className="gap-3">
            {stats && (
                <Card className="gap-1.5">
                    <Text className="text-textSecondary text-sm">Total stats</Text>
                    <StatList stats={stats} />
                </Card>
            )}

            {locked && (
                <Card className="border-warning">
                    <Text className="text-textSecondary text-xs">Gear is locked while a task in this category is running.</Text>
                </Card>
            )}

            {slots.map((slot) => (
                <SlotRow key={slot.slot.id} slot={slot} disabled={locked} onPress={() => setPickerSlotId(slot.slot.id)} />
            ))}
            {status === "ready" && slots.length === 0 && (
                <Text className="text-textMuted text-xs text-center">This category has no gear slots.</Text>
            )}

            {pickerSlot && <SlotPickerModal equippedSlot={pickerSlot} onClose={() => setPickerSlotId(null)} />}
        </View>
    );
}

function SlotRow({ slot, disabled, onPress }: { slot: EquippedSlot; disabled: boolean; onPress: () => void }) {
    const { equipped } = slot;
    return (
        <Card className={`gap-1.5 ${disabled ? "opacity-60" : ""}`} onPress={disabled ? undefined : onPress}>
            <View className="flex-row justify-between items-center">
                <Text className="text-textMuted text-xs">{slot.slot.name}</Text>
                {!disabled && <Text className="text-primary text-xs">{equipped ? "Change" : "Equip"}</Text>}
            </View>
            {equipped ? (
                <>
                    <View className="flex-row items-center gap-1.5">
                        <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: equipped.rarity.color }} />
                        <Text className="text-textPrimary font-medium">{equipped.equipment.name}</Text>
                        <Text className="text-textMuted text-xs">{equipped.rarity.name}</Text>
                    </View>
                    <StatList stats={equipped.stats} />
                </>
            ) : (
                <Text className="text-textSecondary">Empty</Text>
            )}
        </Card>
    );
}
