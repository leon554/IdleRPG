import { useState } from "react";
import { Text, View } from "react-native";
import type { EquipmentStack, InventoryStack } from "@idlerpg/shared";
import { Modal } from "@/components/primitives/Modal";
import { Card } from "@/components/primitives/Card";
import { Button } from "@/components/primitives/Button";
import { TextBox } from "@/components/primitives/TextBox";
import { SegmentedControl } from "@/components/primitives/SegmentedControl";
import { toast } from "@/components/primitives/Toast";
import { useStore } from "@/lib/store";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { inventoryStore, sellStack } from "@/stores/inventory";
import { GameDataUtil } from "@/util/game-data-util";
import { colors } from "@/theme";
import { EquipmentRarityStats } from "./EquipmentRarityStats";

export const stackName = (s: InventoryStack) => (s.type === "resource" ? s.resource.itemName : s.equipment.name);

// Exact counts are shown here (the list row only shows a compact total)
const exact = (n: number) => n.toLocaleString();

type Tab = "owned" | "stats";

export function InventoryItemModal({ stacks, onClose }: { stacks: InventoryStack[]; onClose: () => void }) {
    const [tab, setTab] = useState<Tab>("owned");
    const equipmentStacks = stacks.filter((s): s is EquipmentStack => s.type === "equipment");
    const isEquipment = equipmentStacks.length > 0;
    const total = stacks.reduce((sum, s) => sum + s.quantity, 0);

    return (
        <Modal visible onClose={onClose} className="gap-3">
            <View className="flex-row items-baseline justify-between gap-3">
                <Text className="text-textPrimary text-lg font-semibold flex-1" numberOfLines={1}>{stackName(stacks[0])}</Text>
                <Text className="text-textSecondary text-sm">{exact(total)} total</Text>
            </View>

            {isEquipment && (
                <SegmentedControl<Tab>
                    options={[{ value: "owned", label: "Owned" }, { value: "stats", label: "Stats" }]}
                    value={tab}
                    onChange={setTab}
                />
            )}

            <View className={tab === "owned" ? "gap-3" : "hidden"}>
                <SellPanel stacks={stacks} />
            </View>
            {isEquipment && tab === "stats" && <EquipmentRarityStats stacks={equipmentStacks} />}
        </Modal>
    );
}

function SellPanel({ stacks }: { stacks: InventoryStack[] }) {
    const selling = useStore(inventoryStore, (s) => s.selling);
    const [selectedRarityId, setSelectedRarityId] = useState<string | null>(stacks.length === 1 ? stacks[0].rarity.id : null);
    const [amountText, setAmountText] = useState("");
    const [amount, setAmount] = useState<number | null>(null);

    const sorted = [...stacks].sort((a, b) => a.rarity.tier - b.rarity.tier);
    const selected = sorted.find((s) => s.rarity.id === selectedRarityId) ?? null;
    const unitPrice = selected ? GameDataUtil.getVendorSellPrice(selected) : 0;
    const canSell = selected !== null && amount !== null && amount >= 1 && amount <= selected.quantity;

    const setAmountValue = (value: number | null) => {
        setAmount(value);
        setAmountText(value === null ? "" : String(value));
    };

    const select = (stack: InventoryStack) => {
        setSelectedRarityId(stack.rarity.id);
        setAmountValue(null);
    };

    const sell = async () => {
        if (!selected || !canSell || amount === null) return;
        try {
            const result = await sellStack(selected, amount);
            toast.success(`Sold ${exact(amount)} ${selected.rarity.name} ${stackName(selected)} for ${GameDataUtil.formatCompactNumber(result.goldEarned)} gold`);
            if (result.remainingQuantity === 0) setSelectedRarityId(null);
            setAmountValue(null);
        } catch (error) {
            toast.error(errorMessage(error));
        }
    };

    return (
        <>
            <View className="gap-2">
                {sorted.map((stack) => {
                    const isSelected = stack.rarity.id === selectedRarityId;
                    return (
                        <Card
                            key={stack.rarity.id}
                            onPress={() => select(stack)}
                            className="flex-row items-center gap-2 px-3 py-2.5"
                            style={isSelected ? { borderColor: colors.primary } : undefined}
                        >
                            <View className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: stack.rarity.color }} />
                            <Text className="text-textSecondary flex-1">{stack.rarity.name}</Text>
                            <Text className="text-textPrimary font-medium">{exact(stack.quantity)}</Text>
                            <Text className="text-textMuted text-xs w-16 text-right">
                                {GameDataUtil.formatCompactNumber(GameDataUtil.getVendorSellPrice(stack))}g ea
                            </Text>
                        </Card>
                    );
                })}
            </View>

            {selected ? (
                <View className="gap-2">
                    <View className="flex-row items-stretch gap-2">
                        <View className="flex-1">
                            <TextBox
                                placeholder="Amount"
                                numeric
                                min={1}
                                max={selected.quantity}
                                value={amountText}
                                onChangeText={setAmountText}
                                onChangeNumber={setAmount}
                            />
                        </View>
                        <Button title="Max" size="sm" variant="secondary" className="px-4" style={{ alignSelf: "stretch" }}
                            onPress={() => setAmountValue(selected.quantity)} />
                    </View>
                    <Button
                        title={canSell
                            ? `Sell ${exact(amount!)} ${selected.rarity.name} for ${GameDataUtil.formatCompactNumber(unitPrice * amount!)} gold`
                            : `Sell ${selected.rarity.name}`}
                        fullWidth
                        loading={selling}
                        disabled={!canSell || selling}
                        onPress={sell}
                    />
                </View>
            ) : (
                <Text className="text-textMuted text-xs text-center">Tap a rarity to sell it</Text>
            )}
        </>
    );
}
