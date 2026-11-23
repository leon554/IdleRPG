import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import { isApiError } from "@/lib/api-service-layer/errors";
import type { EquipmentStack, EquippedSlot, EquipRequest, UnequipRequest } from "@idlerpg/shared";
import { refresh } from "./refresh";

type EquipmentState = {
    slots: EquippedSlot[];
    status: "idle" | "loading" | "ready" | "error";
    pendingSlotId: string | null;   // the slot an equip/unequip request is in flight for
};

export const equipmentStore = createStore<EquipmentState>({ slots: [], status: "idle", pendingSlotId: null });

export const loadEquipment = async () => {
    if (equipmentStore.getState().status !== "ready") equipmentStore.setState({ status: "loading" });
    try {
        const slots = await request<EquippedSlot[]>("/gamedata/equipment");
        equipmentStore.setState({ slots, status: "ready" });
    } catch (error) {
        equipmentStore.setState({ status: "error" });
        throw error;
    }
};

const changeSlot = async (slotId: string, path: string, body: EquipRequest | UnequipRequest) => {
    equipmentStore.setState({ pendingSlotId: slotId });
    try {
        const slots = await request<EquippedSlot[]>(path, { method: "POST", body: JSON.stringify(body) });
        equipmentStore.setState({ slots, status: "ready" });
        await refresh("inventory", "stats"); // the item moved in/out of the inventory and the category's stats changed
    } catch (error) {
        // Our view was stale (item already gone, or a task started): resync before the caller shows the error
        if (isApiError(error, "not_enough_items") || isApiError(error, "slot_locked_by_task")) {
            await refresh("inventory", "task", "equipment").catch(() => {});
        }
        throw error;
    } finally {
        equipmentStore.setState({ pendingSlotId: null });
    }
};

export const equipItem = (slotId: string, stack: EquipmentStack) =>
    changeSlot(slotId, "/gamedata/equipment/equip", { slotId, equipmentId: stack.equipment.id, rarityId: stack.rarity.id });

export const unequipItem = (slotId: string) =>
    changeSlot(slotId, "/gamedata/equipment/unequip", { slotId });
