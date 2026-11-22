import { capitliseFirst } from "@/auth/util";
import { Button } from "@/components/primitives/Button";
import { Card } from "@/components/primitives/Card";
import { Modal } from "@/components/primitives/Modal";
import { TextBox } from "@/components/primitives/TextBox";
import { toast } from "@/components/primitives/Toast";
import { errorMessage } from "@/lib/api-service-layer/errors";
import { useStore } from "@/lib/store";
import { inventoryStore, sellStack } from "@/stores/inventory";
import { GameDataUtil } from "@/util/game-data-util";
import { InventoryStack } from "@idlerpg/shared";
import { useState } from "react";
import { View, Text } from "react-native";

const stackName = (s: InventoryStack) => (s.type === 'resource' ? s.resource.itemName : s.equipment.name)

export function InventoryRow({ stack, isLast }: { stack: InventoryStack; isLast: boolean }) {
    const [open, setOpen] = useState(false)
    const [wantToSell, setWantToSell] = useState(false)
    const [sellAmount, setSellAmount] = useState("0")
    const [formattedSellAmount, setFormattedSellAmount] = useState<null | number>(null)
    const selling = useStore(inventoryStore, (s) => s.selling)

    const unitPrice = GameDataUtil.getVendorSellPrice(stack)
    const canSell = (formattedSellAmount ?? 0) > 0

    const close = () => {
        setOpen(false)
        setWantToSell(false)
        setSellAmount("0")
        setFormattedSellAmount(null)
    }

    const onSell = async () => {
        const quantity = formattedSellAmount ?? 0
        if (quantity <= 0) return
        try {
            const result = await sellStack(stack, quantity)
            toast.success(`Sold ${GameDataUtil.formatCompactNumber(quantity)} ${stackName(stack)} for ${GameDataUtil.formatCompactNumber(result.goldEarned)} gold`)
            close()
        } catch (error) {
            toast.error(errorMessage(error))
        }
    }

    return (
        <>
            <Card variant="none" className={`flex-row items-center gap-3 px-4 py-3 ${isLast ? '' : 'border-b border-border'}`}
                onPress={() => {
                    setOpen(true)
                }}
            >
                <View className="w-4 h-4 rounded-md" style={{ backgroundColor: stack.rarity.color }} />
                <View className="flex-1">
                    <Text className="text-textPrimary" numberOfLines={1} style={{ color: stack.rarity.color }}>
                        {stackName(stack)}
                    </Text>
                    {stack.type === 'equipment' && <Text className="text-textMuted text-xs">Equipment</Text>}
                </View>
                <Text className="text-textPrimary font-semibold text-right min-w-10">
                    {GameDataUtil.formatCompactNumber(stack.quantity)}
                </Text>
            </Card>
            <Modal visible={open} onClose={close} className="gap-2">
                <Text className="text-textPrimary text-lg font-semibold" numberOfLines={1} style={{ color: stack.rarity.color }}>
                    {stackName(stack)}
                </Text>
                {stack.type == "equipment" ? 
                <View className="gap-3 justify-between flex-row">
                    <Text className="text-textSecondary ">
                        Qauntity: {GameDataUtil.formatCompactNumber(stack.quantity)}
                    </Text>
                    <Text className="text-textSecondary ">
                        Unit Sell Price: {GameDataUtil.formatCompactNumber(unitPrice)}
                    </Text>
                </View> :
                <View className="gap-3 justify-between flex-row">
                    <Text className="text-textSecondary ">
                        Qauntity: {GameDataUtil.formatCompactNumber(stack.quantity)}
                    </Text>
                    <Text className="text-textSecondary ">
                        Unit Sell Price: {GameDataUtil.formatCompactNumber(unitPrice)}
                    </Text>
                    <Text className="text-textSecondary ">
                        Category: {capitliseFirst(stack.resource.categoryId)}
                    </Text>
                </View>}
                <View className="gap-2">
                    {wantToSell &&
                        <>
                            <View className="border-t border-textMuted"></View>
                            <TextBox
                                label={`Qauntity To Sell`}
                                numeric
                                min={0}
                                max={stack.quantity}
                                value={sellAmount}
                                onChangeText={v => setSellAmount(v)}
                                onChangeNumber={n => setFormattedSellAmount(n)}
                            />
                        </>
                    }
                    <Button
                        title={wantToSell ? `Sell for $${GameDataUtil.formatCompactNumber(unitPrice * (formattedSellAmount ?? 0))}` : "Sell"}
                        size="sm"
                        variant="secondary"
                        fullWidth
                        loading={selling}
                        disabled={wantToSell && !canSell}
                        onPress={wantToSell ? onSell : () => setWantToSell(true)}
                    />
                </View>
            </Modal>
        </>
    )
}
