import { ApiError } from "./util";

const MESSAGES = {
    internal_error: "Something went wrong on our side.",
    email_taken: "Email is already in use. Log in instead.",
    resend_cooldown: "Please wait until sending a new email code",
    wrong_code: "Incorrect code try again",
    too_many_attempts: "Too many attempts for this code please generate another code",
    code_expired: "Email cope has expired please generate a new one",
    invalid_credentials: "Credentials are wrong check for any spelling errors",
    already_verified: "Email is allready verified"
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