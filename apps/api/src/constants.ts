export enum EmailVerificationPurpose{
    EmailVerification = "EmailVerification",
    PasswordReset = "PasswordReset"
}

export const EMAIL_CODE_EXPIRATION = 1000 * 60 * 10
export const SESSION_EXPIRATION = 1000 * 60 * 60 * 24 * 30