import type { Request, Response, RequestHandler } from "express";



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

export function withBody<S extends Schema>(schema: S, handler: (body: Infer<S>, req: Request, res: Response) => unknown): RequestHandler {
    return async (req, res, next) => {
        const body = validate(schema, req.body);
        if (!body) return res.status(400).json({ error: "invalid_input" });
    
        try {
            await handler(body, req, res);
        } catch (err) {
            next(err);
        }
    };
}