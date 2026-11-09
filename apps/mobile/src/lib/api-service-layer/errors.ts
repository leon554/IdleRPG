import { ApiError } from "./util";

const MESSAGES = {
    network_error: "Can't reach the server. Check your connection.",
    timeout: "The request took too long. Please try again.",
    unauthorized: "Your session expired. Please sign in again.",
    forbidden: "You don't have permission to do that.",
    not_found: "We couldn't find that.",
    rate_limited: "Too many requests. Try again in a moment.",
    internal_error: "Something went wrong on our side.",
    email_taken: "Email is already in use. Log in instead.",
    resend_cooldown: "Please wait until sending a new email code"
} as const satisfies Record<string, string>;

export type ErrorCode = keyof typeof MESSAGES;

export function errorMessage(e: unknown): string {
    if (e instanceof ApiError) {
        const known = (MESSAGES as Record<string, string>)[e.code];
        return known ?? (e.status >= 500 ? MESSAGES.internal_error : "Something went wrong.");
    }
    return "Something went wrong.";
}

export const isApiError = (e: unknown, code?: ErrorCode): e is ApiError =>
    e instanceof ApiError && (code === undefined || e.code === code);

export const isRetryable = (e: unknown) =>
    e instanceof ApiError && (e.code === "network_error" || e.code === "timeout" || e.status >= 502);