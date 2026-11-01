import { RATE_LIMITS } from "../constants.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { getAuthUser } from "../middleware/requireAuth.js";

export const emailIpRateLimiter = rateLimit({...RATE_LIMITS.emailRateLimit, key: (req, _) => {
    return `${req.ip}`
}})

export const emailUserRateLimiter = rateLimit({...RATE_LIMITS.emailRateLimit, key: (_, res) => {
    return `${getAuthUser(res).id}`
}})

export const signUpRateLimiter = rateLimit({...RATE_LIMITS.signupRateLimit, key: (req, _) => {
    return `${req.ip}`
}})

export const loginRateLimiter = rateLimit({...RATE_LIMITS.loginRateLimit, key: (req, _) => {
    return `${req.ip}`
}})

