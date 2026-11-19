export const fail = (status: number, message: string) => ({ ok: false as const, status, message });
export const success = <T,>(payload: T) => ({ ok: true as const, payload });
export type Outcome<T> = ReturnType<typeof fail> | ReturnType<typeof success<T>>;
