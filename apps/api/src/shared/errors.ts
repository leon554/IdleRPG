import type { ErrorCode } from "@idlerpg/shared";

type ErrorDetails = Record<string, unknown>;

// An expected failure. errorHandler sends it as `{ error: code, ...details }` with this status.
export class HttpError extends Error {
    constructor(
        public readonly status: number,
        public readonly code: ErrorCode,
        public readonly details?: ErrorDetails,
    ) {
        super(code);
        this.name = "HttpError";
    }
}

export const badRequest = (code: ErrorCode, details?: ErrorDetails) => new HttpError(400, code, details);
export const unauthorized = (code: ErrorCode = "unauthorized", details?: ErrorDetails) => new HttpError(401, code, details);
export const forbidden = (code: ErrorCode, details?: ErrorDetails) => new HttpError(403, code, details);
export const notFound = (code: ErrorCode, details?: ErrorDetails) => new HttpError(404, code, details);
export const conflict = (code: ErrorCode, details?: ErrorDetails) => new HttpError(409, code, details);
export const tooManyRequests = (code: ErrorCode = "too_many_attempts", details?: ErrorDetails) => new HttpError(429, code, details);
