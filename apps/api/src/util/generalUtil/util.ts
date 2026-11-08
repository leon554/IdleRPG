export namespace Util{
    export function removeObjectKey<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
        return Object.fromEntries(
            Object.entries(obj).filter(([entryKey]) => entryKey !== String(key)),
        ) as Omit<T, K>;
    }
}