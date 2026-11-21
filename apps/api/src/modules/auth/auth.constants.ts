export const EmailVerificationPurpose = {
    EmailVerification: "verify_email",
    PasswordReset: "reset_password",
} as const;

export const EMAIL_CODE_EXPIRATION = 1000 * 60 * 10
export const RESEND_COOLDOWN_MS = 60 * 1000;
export const SESSION_EXPIRATION = 1000 * 60 * 60 * 24 * 30
export const REFRESH_AFTER = 1000 * 60 * 60 * 24;
export const TOKEN_LENGTH = 43;
export const MAX_EMAIL_CODE_ATTEMPS = 5
