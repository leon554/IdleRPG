import { createStore } from "@/lib/store";
import { request } from "@/lib/api-service-layer/util";
import type { Inventory } from "@idlerpg/shared";

type InventoryState = {
    inventory: Inventory | null;
    status: "idle" | "loading" | "ready" | "error";
};

export const inventoryStore = createStore<InventoryState>({ inventory: null, status: "idle" });

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
