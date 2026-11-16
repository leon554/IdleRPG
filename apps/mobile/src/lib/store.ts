import { useSyncExternalStore } from "react";

type Listener = () => void;

export const createStore = <T,>(initial: T) => {
    let state = initial;
    const listeners = new Set<Listener>();
    const notify = () => listeners.forEach((listener) => listener());

    return {
        getState: () => state,
        setState: (update: Partial<T> | ((s: T) => Partial<T>)) => {
            const partial = typeof update === "function" ? update(state) : update;
            state = { ...state, ...partial };
            notify();
        },
        reset: () => {
            state = initial;
            notify();
        },
        subscribe: (listener: Listener) => {
            listeners.add(listener);
            return () => {
                listeners.delete(listener);
            };
        },
    };
};

export type Store<T> = ReturnType<typeof createStore<T>>;

export const useStore = <T, S>(store: Store<T>, selector: (state: T) => S): S =>
    useSyncExternalStore(store.subscribe, () => selector(store.getState()));
