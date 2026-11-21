import { rateLimit } from "../../middleware/rateLimit.js";
import { getAuthUser } from "../../middleware/requireAuth.js";

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
