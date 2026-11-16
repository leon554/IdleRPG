import { statsStore, loadStats } from "./stats";

const loaders = {
    stats: loadStats,
} as const;

const stores = [statsStore];

export type Slice = keyof typeof loaders;

export const refresh = (...slices: Slice[]) =>
    Promise.all(slices.map((slice) => loaders[slice]()));

export const refreshAll = () => refresh(...(Object.keys(loaders) as Slice[]));

export const resetAllStores = () => stores.forEach((store) => store.reset());
