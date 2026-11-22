import { statsStore, loadStats } from "./stats";
import { taskStore, loadActiveTask } from "./task";

const loaders = {
    stats: loadStats,
    task: loadActiveTask,
} as const;

const stores = [statsStore, taskStore];

export type Slice = keyof typeof loaders;

export const refresh = (...slices: Slice[]) =>
    Promise.all(slices.map((slice) => loaders[slice]()));

export const refreshAll = () => refresh(...(Object.keys(loaders) as Slice[]));

export const resetAllStores = () => stores.forEach((store) => store.reset());
