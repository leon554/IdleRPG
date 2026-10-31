import type { SignUpBody } from "@idlerpg/shared";
import { Router } from "express";
import { validate } from "../validation/validate.js";
import { signUpSchema } from "../validation/schemas.js";
import { hashPassword } from "../util/password.js";
import { generateSessionToken, hashSessionToken } from "../util/sessionToken.js";
import { generateEmailCode, hashEmailCode } from "../util/emailCode.js";
import { db } from "../db/index.js";
import { emailVerification, session, users } from "../db/schema.js";
import { EMAIL_CODE_EXPIRATION, EmailVerificationPurpose, SESSION_EXPIRATION } from "../constants.js";
import { isUniqueViolation } from "../errorHandler.js";

export const authRouter = Router()

authRouter.post("/signup", async (req, res) => {
    const data = validate(signUpSchema, req.body)
    if (!data) return res.status(400).json({ error: "invalid_input" });

    const passwordHash = await hashPassword(data.password);
    const sessionToken = generateSessionToken();
    const emailCode = generateEmailCode();

    try {
        await db.transaction(async (tx) => {
            const [user] = await tx.insert(users).values({
                userName: data.userName,
                email: data.email,
                passwordHash,
            }).returning({ id: users.id });

            await tx.insert(session).values({
                userId: user.id,
                sessionHash: hashSessionToken(sessionToken),
                expiresAt: new Date(Date.now() + SESSION_EXPIRATION),
                deviceInfo: "",
            });

            await tx.insert(emailVerification).values({
                userId: user.id,
                purpose: EmailVerificationPurpose.EmailVerification,
                tokenHash: hashEmailCode(emailCode),
                expiresAt: new Date(Date.now() + EMAIL_CODE_EXPIRATION),
            });
        });
    } catch (err) {
        if (isUniqueViolation(err)) {
            return res.status(409).json({ error: "email_taken" });
        }
        throw err; 
    }

    //placeholder send email before sending email also check that a email inst allready sent
    console.log(emailCode)

    return res.status(201).json({ token: sessionToken });
})