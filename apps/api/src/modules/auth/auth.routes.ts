import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { emailIpRateLimiter, emailUserRateLimiter, loginRateLimiter, signUpRateLimiter } from "./auth.rateLimits.js";
import * as authController from "./auth.controller.js";

export const authRouter = Router();

authRouter.post("/signup", signUpRateLimiter, authController.signUp);
authRouter.post("/verify-email-code", emailIpRateLimiter, requireAuth, emailUserRateLimiter, authController.verifyEmailCode);
authRouter.post("/login", loginRateLimiter, authController.logIn);
authRouter.get("/get-user", requireAuth, authController.getUser);
authRouter.post("/send-new-email-code", requireAuth, authController.sendNewEmailCode);
authRouter.post("/logout", requireAuth, authController.logOut);
