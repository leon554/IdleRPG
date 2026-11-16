export namespace Util{
    export function removeObjectKey<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
        return Object.fromEntries(
            Object.entries(obj).filter(([entryKey]) => entryKey !== String(key)),
        ) as Omit<T, K>;
    }
    export function groupByKey<T extends object, K extends keyof T>(rows: T[], key: K) {
        const map = new Map<T[K], Omit<T, K>[]>();
        for (const row of rows) {
            const { [key]: k, ...rest } = row;
            let list = map.get(k);
            if (!list) map.set(k, (list = []));
            list.push(rest);
        }
        return map;
    }
}