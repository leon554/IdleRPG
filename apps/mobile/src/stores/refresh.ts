import { statsStore, loadStats } from "./stats";
import { taskStore, loadActiveTask } from "./task";
import { inventoryStore, loadInventory } from "./inventory";
import { loadProgress, progressStore } from "./progress";

const loaders = {
    stats: loadStats,
    task: loadActiveTask,
    inventory: loadInventory,
    progress: loadProgress
} as const;

const stores = [statsStore, taskStore, inventoryStore, progressStore];

export type Slice = keyof typeof loaders;

export const refresh = (...slices: Slice[]) =>
    Promise.all(slices.map((slice) => loaders[slice]()));

export const refreshAll = () => refresh(...(Object.keys(loaders) as Slice[]));

export const resetAllStores = () => stores.forEach((store) => store.reset());
