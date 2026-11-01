import type { RateLimitOption } from "./middleware/rateLimit.js";

export enum EmailVerificationPurpose{
    EmailVerification = "EmailVerification",
    PasswordReset = "PasswordReset"
}

export const EMAIL_CODE_EXPIRATION = 1000 * 60 * 10
export const SESSION_EXPIRATION = 1000 * 60 * 60 * 24 * 30
export const REFRESH_AFTER = 1000 * 60 * 60 * 24; 
export const TOKEN_LENGTH = 43;      
export const MAX_EMAIL_CODE_ATTEMPS = 5  
export const DEFUALT_RATELIMIT_WINDOW = 1000 * 60
export const DEFUALT_RATELIMIT_MAXREQUEST = 5

export const RATE_LIMITS = {
    emailRateLimit: {windowMS: DEFUALT_RATELIMIT_WINDOW, maxRequests: DEFUALT_RATELIMIT_MAXREQUEST},
    signupRateLimit: {windowMS: 1000 * 60 * 60, maxRequests: 10},
    loginRateLimit: {windowMS: 1000 * 60 * 60, maxRequests: 10}
} satisfies Record<any, Omit<RateLimitOption, "key">>