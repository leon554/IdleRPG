import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import { isApiError } from "@/lib/api-service-layer/errors";
import type { Inventory, InventoryStack, SellRequest, SellResult } from "@idlerpg/shared";

type InventoryState = {
    inventory: Inventory | null;
    status: "idle" | "loading" | "ready" | "error";
    selling: boolean; 
};

export const inventoryStore = createStore<InventoryState>({ inventory: null, status: "idle", selling: false });

export const loadInventory = async () => {
    if (inventoryStore.getState().status !== "ready") inventoryStore.setState({ status: "loading" });
    try {
        const inventory = await request<Inventory>("/gamedata/inventory");
        inventoryStore.setState({ inventory, status: "ready" });
    } catch (error) {
        inventoryStore.setState({ status: "error" });
        throw error;
    }
};

export const sellStack = async (stack: InventoryStack, quantity: number): Promise<SellResult> => {
    inventoryStore.setState({ selling: true });
    try {
        const body: SellRequest = {
            itemType: stack.type,
            itemId: stack.type === "resource" ? stack.resource.id : stack.equipment.id,
            rarityId: stack.rarity.id,
            quantity,
        };
        const result = await request<SellResult>("/gamedata/inventory/sell", { method: "POST", body: JSON.stringify(body) });
        await loadInventory();
        return result;
    } catch (error) {
        if (isApiError(error, "not_enough_items")) await loadInventory().catch(() => {});
        throw error;
    } finally {
        inventoryStore.setState({ selling: false });
    }
};
