import type { ErrorRequestHandler } from "express";
import type { ErrorCode } from "@idlerpg/shared";
import { HttpError } from "./shared/errors.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (res.headersSent) return;

  if (err instanceof HttpError) {
    // Services can't set headers, so a numeric `retryAfter` detail also becomes the Retry-After header
    const retryAfter = err.details?.retryAfter;
    if (typeof retryAfter === "number") res.set("Retry-After", String(retryAfter));

    return res.status(err.status).json({ ...err.details, error: err.code });
  }

  console.error(`${req.method} ${req.path}`, err);
  const code: ErrorCode = "internal_error";
  res.status(500).json({ error: code });
};

export function isUniqueViolation(err: unknown, constraint?: string): boolean {
  type PgError = { code?: string; constraint?: string };
  const e = err as PgError & { cause?: PgError };
  return [e, e?.cause].some(
    (pg) => pg?.code === "23505" && (constraint === undefined || pg.constraint === constraint),
  );
}
