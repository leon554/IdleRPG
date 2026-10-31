
export type Validator<T> = ((value: unknown) => T | undefined) & { optional?: boolean };
export type Schema = Record<string, Validator<unknown>>;

type OptionalKeys<S extends Schema> = {
    [K in keyof S]: S[K] extends { optional: true } ? K : never;
}[keyof S];


export type Infer<S extends Schema> = {
    [K in Exclude<keyof S, OptionalKeys<S>>]: NonNullable<ReturnType<S[K]>>;
} & {
    [K in OptionalKeys<S>]?: NonNullable<ReturnType<S[K]>>;
};

export function validate<S extends Schema>(schema: S, body: unknown): Infer<S> | null {
    if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

    const input = body as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const key of Object.keys(schema)) {
        const raw = input[key];
        if (raw === undefined && schema[key].optional) continue;

        const result = schema[key](raw);
        if (result === undefined) return null;

        out[key] = result;
    }

    return out as Infer<S>;
}