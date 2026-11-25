import type { ErrorCode as ApiErrorCode } from "@idlerpg/shared";
import { ApiError } from "./util";

const MESSAGES = {
    // general
    internal_error: "Something went wrong on our side.",
    unauthorized: "Your session has expired. Please log in again.",
    invalid_input: "Some of the details sent were invalid.",
    too_many_attempts: "Too many attempts for this code please generate another code",

    // auth
    email_taken: "Email is already in use. Log in instead.",
    resend_cooldown: "Please wait until sending a new email code",
    wrong_code: "Incorrect code try again",
    code_expired: "Email cope has expired please generate a new one",
    invalid_credentials: "Credentials are wrong check for any spelling errors",
    already_verified: "Email is allready verified",

    // tasks
    task_already_active: "You already have an active task.",
    no_active_task: "You have no active task.",
    action_not_found: "One or more of those actions don't exist.",
    gathering_group_not_found: "That gathering spot doesn't exist.",
    recipe_not_found: "That recipe doesn't exist.",
    requirements_not_met: "You don't meet the requirements for this task.",
    invalid_recipe_inputs: "Pick exactly one rarity for each required resource.",
    inventory_not_found: "Your inventory couldn't be found.",
    not_enough_resources: "You don't have enough resources for that many crafts.",
    not_enough_gp_for_rotation: "This rotation costs more gathering points than you have.",
    not_enough_progress_for_task: "This rotation doesn't reach the progress requirement.",
    not_enough_items: "You don't have enough of that item.",
    inventory_full: "Your inventory is full. Sell items to free up space.",
    slot_not_found: "That gear slot doesn't exist.",
    equipment_wrong_slot: "That item doesn't fit this slot.",
    slot_locked_by_task: "You can't change gear in this category while a task is running.",
    slot_empty: "Nothing is equipped in that slot."
} as const satisfies Record<ApiErrorCode, string>;

export type ErrorCode = ApiErrorCode | "network_error" | "timeout";

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