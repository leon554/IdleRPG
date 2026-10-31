import type { ErrorRequestHandler } from "express";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  console.error(`${req.method} ${req.path}`, err);

  if (res.headersSent) return;

  res.status(500).json({ error: "internal_error" });
};

export function isUniqueViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === "23505" || e?.cause?.code === "23505";
}