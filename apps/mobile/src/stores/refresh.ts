import { statsStore, loadStats } from "./stats";
import { taskStore, loadActiveTask } from "./task";
import { inventoryStore, loadInventory } from "./inventory";

const loaders = {
    stats: loadStats,
    task: loadActiveTask,
    inventory: loadInventory,
} as const;

const stores = [statsStore, taskStore, inventoryStore];

export type Slice = keyof typeof loaders;

export const refresh = (...slices: Slice[]) =>
    Promise.all(slices.map((slice) => loaders[slice]()));

export const refreshAll = () => refresh(...(Object.keys(loaders) as Slice[]));

export const resetAllStores = () => stores.forEach((store) => store.reset());
