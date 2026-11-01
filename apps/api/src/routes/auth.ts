import type { SignUpBody } from "@idlerpg/shared";
import { Router } from "express";
import { validate, withBody } from "../validation/validate.js";
import { emailVerificationSchema, loginSchema, signUpSchema } from "../validation/schemas.js";
import { hashPassword, verifyPassword } from "../util/password.js";
import { generateSessionToken, hashSessionToken } from "../util/sessionToken.js";
import { emailCodesMatch, generateEmailCode, hashEmailCode } from "../util/emailCode.js";
import { db } from "../db/index.js";
import { emailVerification, session, users } from "../db/schema.js";
import { EMAIL_CODE_EXPIRATION, EmailVerificationPurpose, MAX_EMAIL_CODE_ATTEMPS, SESSION_EXPIRATION } from "../constants.js";
import { isUniqueViolation } from "../errorHandler.js";
import { and, desc, eq, isNull, gt, sql} from "drizzle-orm";
import { getAuthUser, requireAuth } from "../middleware/requireAuth.js";
import { emailIpRateLimiter, emailUserRateLimiter, loginRateLimiter, signUpRateLimiter } from "../util/routeRateLimits.js";

export const authRouter = Router()

authRouter.post("/signup", signUpRateLimiter, withBody(signUpSchema, async (data, _, res) => {
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
}))

authRouter.post("/verify-email-code", 
    emailIpRateLimiter, 
    requireAuth, 
    emailUserRateLimiter, 
    withBody(emailVerificationSchema, async (data, req, res) => 
{

    const user = getAuthUser(res)
    if (user.emailVerifiedAt) return res.status(200).json({ verified: true });

    const [latestCode] = await db
        .select()
        .from(emailVerification)
        .where(and(
            eq(emailVerification.userId, user.id),
            eq(emailVerification.purpose, EmailVerificationPurpose.EmailVerification),
            gt(emailVerification.expiresAt, new Date()),
        ))
        .orderBy(desc(emailVerification.createdAt))
        .limit(1);

    if(!latestCode){
        return res.status(404).json({ error: "wrong code" });
    }

    if(latestCode.attempts >= MAX_EMAIL_CODE_ATTEMPS){
        return res.status(429).json({ error: "too_many_attempts" });
    }
    
    if(emailCodesMatch(data.emailCode, latestCode.tokenHash)){
        await db.transaction(async (tx) => {
            await tx
                .update(users)
                .set({emailVerifiedAt: new Date()})
                .where(eq(users.id, user.id))
            await tx
                .delete(emailVerification)
                .where(and(
                    eq(emailVerification.userId, user.id),
                    eq(emailVerification.purpose, EmailVerificationPurpose.EmailVerification),
                ))
        });
        return res.status(200).json({ verified: true });
    }

    await db.update(emailVerification)
        .set({attempts: sql`${emailVerification.attempts} + 1`})
        .where(and(eq(emailVerification.userId, user.id), eq(emailVerification.id, latestCode.id)))
    
    return res.status(404).json({ error: "wrong code" });
    
}))

const DUMMY_HASH = await hashPassword("timing-safety-placeholder");

authRouter.post("/login", loginRateLimiter, withBody(loginSchema, async (data, req, res) => {
    const [user] = await db
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, data.email))
        .limit(1);

    const passwordOk = await verifyPassword(data.password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) {
        return res.status(401).json({ error: "invalid_credentials" });
    }

    const sessionToken = generateSessionToken();

    await db.insert(session).values({
        userId: user.id,
        sessionHash: hashSessionToken(sessionToken),
        expiresAt: new Date(Date.now() + SESSION_EXPIRATION),
        deviceInfo: "",
    });

    return res.status(200).json({ token: sessionToken });
}));