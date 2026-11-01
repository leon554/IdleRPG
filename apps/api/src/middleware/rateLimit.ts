import type { Request, RequestHandler, Response } from "express"

type Entry = {count: number, resetAt: number}

export type RateLimitOption = {
    windowMS: number,
    maxRequests: number,
    key: (req: Request, res: Response) => string | undefined
}

export function rateLimit(options: RateLimitOption): RequestHandler {
    const hits = new Map<string, Entry>();
    let lastCleanup = Date.now();

    return (req, res, next) => {
        const now = Date.now();

        if (now - lastCleanup >= options.windowMS) {
            for (const [key, value] of hits) {
                if (value.resetAt <= now) hits.delete(key);
            }
            lastCleanup = now;
        }

        const key = options.key(req, res);
        if (!key) return next();

        const entry = hits.get(key);

        if (!entry || entry.resetAt <= now) {
            hits.set(key, { count: 1, resetAt: now + options.windowMS });
            return next();
        }

        if (entry.count >= options.maxRequests) {
            res.set("Retry-After", String(Math.ceil((entry.resetAt - now) / 1000)));
            return res.status(429).json({ error: "too_many_attempts" });
        }

        entry.count++;
        next();
    };
}