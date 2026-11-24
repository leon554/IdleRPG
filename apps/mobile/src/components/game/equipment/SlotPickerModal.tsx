import { useMemo } from "react";
import { ScrollView, Text, View } from "react-native";
import type { CategoryStats, EquipmentStack, EquippedSlot } from "@idlerpg/shared";
import { Modal } from "@/components/primitives/Modal";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { toast } from "@/components/primitives/Toast";
import { useStore } from "@/lib/store";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { capitliseFirst } from "@/auth/util";
import { equipItem, equipmentStore, unequipItem } from "@/stores/equipment";
import { inventoryStore } from "@/stores/inventory";
import { progressStore } from "@/stores/progress";
import { StatList } from "./StatList";

const NO_STATS: CategoryStats = { progress: 0, quality: 0, yield: 0, gatheringPoints: 0 };
const statScore = (s: CategoryStats | null) => (s ? s.progress + s.quality + s.yield + s.gatheringPoints : -1);

type Candidate = { stack: EquipmentStack; blockedReason: string | null };


export function SlotPickerModal({ equippedSlot, onClose }: { equippedSlot: EquippedSlot; onClose: () => void }) {
    const { slot, equipped } = equippedSlot;
    const stacks = useStore(inventoryStore, (s) => s.inventory?.equipment);
    const level = useStore(progressStore, (p) => p.progress[slot.categoryId]?.level) ?? 1;
    const pending = useStore(equipmentStore, (s) => s.pendingSlotId === slot.id);

    const candidates = useMemo<Candidate[]>(() => (stacks ?? [])
        .filter((s) => s.equipment.typeId === slot.equipmentTypeId
            && (s.equipment.categoryId === null || s.equipment.categoryId === slot.categoryId))
        .map((stack) => ({
            stack,
            blockedReason: !stack.stats
                ? "Can't be equipped at this rarity"
                : level < stack.equipment.levelRequirement
                    ? `Requires ${capitliseFirst(slot.categoryId)} ${stack.equipment.levelRequirement}`
                    : null,
        }))
        .sort((a, b) => Number(a.blockedReason !== null) - Number(b.blockedReason !== null) || statScore(b.stack.stats) - statScore(a.stack.stats)),
    [stacks, slot, level]);

    const run = async (action: () => Promise<void>, message: string) => {
        try {
            await action();
            toast.success(message);
            onClose();
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    return (
        <Modal visible onClose={onClose} className="gap-3">
            <Text className="text-textPrimary text-lg font-medium">{slot.name}</Text>

            {equipped && (
                <Card className="bg-surfaceRaised">
                    <Text className="text-textMuted text-xs">Equipped</Text>
                    <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center gap-1.5 flex-1">
                            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: equipped.rarity.color }} />
                            <Text className="text-textPrimary">{equipped.equipment.name}</Text>
                        </View>
                        <Button
                            title="Unequip"
                            size="sm"
                            variant="secondary"
                            loading={pending}
                            disabled={pending}
                            onPress={() => run(() => unequipItem(slot.id), `Unequipped ${equipped.equipment.name}`)}
                        />
                    </View>
                    <StatList stats={equipped.stats} />
                </Card>
            )}

            <Text className="text-textSecondary text-sm">Your items</Text>
            {candidates.length === 0 ? (
                <Text className="text-textMuted text-xs">You don't have any items that fit this slot.</Text>
            ) : (
                <ScrollView className="max-h-80" contentContainerClassName="gap-2" showsVerticalScrollIndicator={false}>
                    {candidates.map(({ stack, blockedReason }) => (
                        <Card
                            key={`${stack.equipment.id}:${stack.rarity.id}`}
                            className={`gap-1 p-3 bg-surfaceRaised ${blockedReason ? "opacity-50" : ""}`}
                            onPress={blockedReason || pending ? undefined
                                : () => run(() => equipItem(slot.id, stack), `Equipped ${stack.equipment.name}`)}
                        >
                            <View className="flex-row items-center justify-between">
                                <View className="flex-row items-center gap-1.5 flex-1">
                                    <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stack.rarity.color }} />
                                    <Text className="text-textPrimary">{stack.equipment.name}</Text>
                                    <Text className="text-textMuted text-xs">×{stack.quantity}</Text>
                                </View>
                                {!blockedReason && <Text className="text-primary text-xs">{equipped ? "Swap" : "Equip"}</Text>}
                            </View>
                            {blockedReason ? (
                                <Text className="text-xs text-danger">{blockedReason}</Text>
                            ) : (
                                <StatList stats={stack.stats!} compareTo={equipped?.stats ?? NO_STATS} />
                            )}
                        </Card>
                    ))}
                </ScrollView>
            )}
        </Modal>
    );
}
