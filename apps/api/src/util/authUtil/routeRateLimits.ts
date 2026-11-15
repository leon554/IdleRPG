import { rateLimit } from "../../middleware/rateLimit.js";
import { getAuthUser } from "../../middleware/requireAuth.js";
import {type RateLimitOption } from "../../middleware/rateLimit.js";

export const DEFUALT_RATELIMIT_WINDOW = 1000 * 60
export const DEFUALT_RATELIMIT_MAXREQUEST = 5

export const RATE_LIMITS = {
    emailRateLimit: {windowMS: DEFUALT_RATELIMIT_WINDOW, maxRequests: DEFUALT_RATELIMIT_MAXREQUEST},
    signupRateLimit: {windowMS: 1000 * 60 * 60, maxRequests: 10},
    loginRateLimit: {windowMS: 1000 * 60 * 60, maxRequests: 10}
} satisfies Record<any, Omit<RateLimitOption, "key">>

export const emailIpRateLimiter = rateLimit({windowMS: 1000 * 60, maxRequests: 5, key: (req, _) => {
    return `${req.ip}`
}})

export const emailUserRateLimiter = rateLimit({windowMS: 1000 * 60 * 60, maxRequests: 10, key: (_, res) => {
    return `${getAuthUser(res).id}`
}})

export const signUpRateLimiter = rateLimit({windowMS: 1000 * 60 * 60, maxRequests: 10, key: (req, _) => {
    return `${req.ip}`
}})

export const loginRateLimiter = rateLimit({windowMS: 1000 * 60 * 60, maxRequests: 10, key: (req, _) => {
    return `${req.ip}`
}})

export const twoAttempsASecondPerIpLimiter = rateLimit({windowMS: 1000 * 60, maxRequests: 120, key: (req, _) => {
    return `${req.ip}`
}})


