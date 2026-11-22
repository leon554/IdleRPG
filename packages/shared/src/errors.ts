export const ERROR_CODES = [
  // general
  "internal_error",
  "unauthorized",
  "invalid_input",
  "too_many_attempts",

  // auth
  "email_taken",
  "resend_cooldown",
  "wrong_code",
  "code_expired",
  "invalid_credentials",
  "already_verified",

  // tasks
  "task_already_active",
  "no_active_task",
  "action_not_found",
  "gathering_group_not_found",
  "recipe_not_found",
  "requirements_not_met",
  "invalid_recipe_inputs",
  "inventory_not_found",
  "not_enough_resources",
  "crafting_claim_not_supported",
  "not_enough_gp_for_rotation",
  "not_enough_progress_for_task"
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];
