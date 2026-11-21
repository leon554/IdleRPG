import { rateLimit } from "./rateLimit.js";

export const twoAttempsASecondPerIpLimiter = rateLimit({windowMS: 1000 * 60, maxRequests: 120, key: (req, _) => {
    return `${req.ip}`
}})
