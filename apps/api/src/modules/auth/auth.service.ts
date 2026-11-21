import type { AuthUser } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import { isUniqueViolation } from "../../errorHandler.js";
import { conflict, notFound, tooManyRequests, unauthorized } from "../../shared/errors.js";
import { Util } from "../../util/generalUtil/util.js";
import {
    EMAIL_CODE_EXPIRATION, EmailVerificationPurpose, MAX_EMAIL_CODE_ATTEMPS,
    REFRESH_AFTER, RESEND_COOLDOWN_MS, SESSION_EXPIRATION, TOKEN_LENGTH,
} from "./auth.constants.js";
import {
    emailCodesMatch, generateEmailCode, generateSessionToken, hashEmailCode,
    hashPassword, hashSessionToken, verifyPassword,
} from "./auth.crypto.js";
import * as authRepo from "./auth.repository.js";

const PURPOSE = EmailVerificationPurpose.EmailVerification;


const DUMMY_HASH = await hashPassword("timing-safety-placeholder");


export async function signUp(data: { userName: string; email: string; password: string }) {
    const passwordHash = await hashPassword(data.password);
    const sessionToken = generateSessionToken();
    const emailCode = generateEmailCode();

    try {
        await db.transaction(async (tx) => {
            const user = await authRepo.insertUser({ userName: data.userName, email: data.email, passwordHash }, tx);

            await authRepo.insertSession({
                userId: user.id,
                sessionHash: hashSessionToken(sessionToken),
                expiresAt: new Date(Date.now() + SESSION_EXPIRATION),
            }, tx);

            await authRepo.insertEmailVerification({
                userId: user.id,
                purpose: PURPOSE,
                tokenHash: hashEmailCode(emailCode),
                expiresAt: new Date(Date.now() + EMAIL_CODE_EXPIRATION),
            }, tx);
        });
    } catch (err) {
        if (isUniqueViolation(err)) throw conflict("email_taken");
        throw err;
    }

    //placeholder send email before sending email also check that a email inst allready sent
    console.log(emailCode)

    return { token: sessionToken };
}

export async function verifyEmailCode(user: AuthUser, emailCode: string) {
    if (user.emailVerifiedAt) return { verified: true };

    const latestCode = await authRepo.findLatestEmailVerification(user.id, PURPOSE, new Date());
    if (!latestCode) throw notFound("code_expired");

    if (latestCode.attempts >= MAX_EMAIL_CODE_ATTEMPS) throw tooManyRequests("too_many_attempts");

    if (emailCodesMatch(emailCode, latestCode.tokenHash)) {
        await db.transaction(async (tx) => {
            await authRepo.markEmailVerified(user.id, tx);
            await authRepo.deleteEmailVerifications(user.id, PURPOSE, tx);
        });
        return { verified: true };
    }

    await authRepo.incrementEmailCodeAttempts(user.id, latestCode.id);
    throw notFound("wrong_code");
}

export async function logIn(email: string, password: string) {
    const user = await authRepo.findUserCredentialsByEmail(email);
    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordOk) throw unauthorized("invalid_credentials");

    const sessionToken = generateSessionToken();
    const now = new Date();

    await authRepo.insertSession({
        userId: user.id,
        sessionHash: hashSessionToken(sessionToken),
        expiresAt: new Date(now.getTime() + SESSION_EXPIRATION),
    });
    await authRepo.deleteExpiredSessions(user.id, now);

    return { token: sessionToken };
}

export async function getUser(userId: string) {
    const user = await authRepo.findUserById(userId);
    if (!user) throw unauthorized(); 
    return Util.removeObjectKey(user, "passwordHash");
}

export async function sendNewEmailCode(user: AuthUser) {
    if (user.emailVerifiedAt) throw conflict("already_verified");

    const now = Date.now();
    const latest = await authRepo.findLatestEmailVerification(user.id, PURPOSE);

    if (latest) {
        const waitMs = latest.createdAt.getTime() + RESEND_COOLDOWN_MS - now;
        if (waitMs > 0) {
            throw tooManyRequests("resend_cooldown", { retryAfter: Math.ceil(waitMs / 1000) });
        }
    }

    const emailCode = generateEmailCode();

    await db.transaction(async (tx) => {
        await authRepo.deleteEmailVerifications(user.id, PURPOSE, tx);
        await authRepo.insertEmailVerification({
            userId: user.id,
            purpose: PURPOSE,
            tokenHash: hashEmailCode(emailCode),
            expiresAt: new Date(now + EMAIL_CODE_EXPIRATION),
        }, tx);
    });

    if (process.env.NODE_ENV !== "production") {
        console.log(`[dev] email code for ${user.id}: ${emailCode}`);
    }

    return { sent: true, retryAfter: RESEND_COOLDOWN_MS / 1000 };
}

export async function logOut(userId: string, token: string) {
    await authRepo.deleteSession(userId, hashSessionToken(token));
    return { loggedOut: true };
}


export async function authenticate(token: string | undefined): Promise<{ user: AuthUser; sessionId: string }> {
    if (!token || token.length !== TOKEN_LENGTH) throw unauthorized();

    const now = new Date();
    const row = await authRepo.findActiveSessionWithUser(hashSessionToken(token), now);
    if (!row) throw unauthorized();

    if (row.expiresAt.getTime() - now.getTime() < SESSION_EXPIRATION - REFRESH_AFTER) {
        await authRepo.extendSession(row.sessionId, new Date(now.getTime() + SESSION_EXPIRATION), now);
    }

    return { user: { id: row.id, emailVerifiedAt: row.emailVerifiedAt }, sessionId: row.sessionId };
}
