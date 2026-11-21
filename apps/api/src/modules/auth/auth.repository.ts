import { and, desc, eq, gt, lte, sql } from "drizzle-orm";
import type { AuthRow } from "@idlerpg/shared";
import { db } from "../../db/index.js";
import { firstOrNull } from "../../db/helpers.js";
import { emailVerification, session, users } from "../../db/schema.js";
import type { Connection } from "../../types/db.js";
import type { EmailVerificationPurpose } from "./auth.constants.js";

type Purpose = (typeof EmailVerificationPurpose)[keyof typeof EmailVerificationPurpose];


export async function insertUser(values: { userName: string; email: string; passwordHash: string }, conn: Connection = db) {
    const [user] = await conn.insert(users).values(values).returning({ id: users.id });
    return user
}

export async function findUserById(userId: string, conn: Connection = db) {
    const rows = await conn.select().from(users).where(eq(users.id, userId));
    return firstOrNull(rows)
}

export async function findUserCredentialsByEmail(email: string, conn: Connection = db) {
    const rows = await conn
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
    return firstOrNull(rows)
}

export async function markEmailVerified(userId: string, conn: Connection = db) {
    await conn.update(users).set({ emailVerifiedAt: new Date() }).where(eq(users.id, userId));
}


export async function insertSession(values: { userId: string; sessionHash: string; expiresAt: Date }, conn: Connection = db) {
    await conn.insert(session).values({ ...values, deviceInfo: "" });
}

export async function findActiveSessionWithUser(sessionHash: string, now: Date, conn: Connection = db): Promise<AuthRow | null> {
    const rows = await conn
        .select({
            sessionId: session.id,
            expiresAt: session.expiresAt,
            id: users.id,
            emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(session)
        .innerJoin(users, eq(users.id, session.userId))
        .where(and(eq(session.sessionHash, sessionHash), gt(session.expiresAt, now)))
        .limit(1);
    return firstOrNull(rows)
}

export async function extendSession(sessionId: string, expiresAt: Date, lastUsedAt: Date, conn: Connection = db) {
    await conn.update(session).set({ expiresAt, lastUsedAt }).where(eq(session.id, sessionId));
}

export async function deleteExpiredSessions(userId: string, now: Date, conn: Connection = db) {
    await conn.delete(session).where(and(eq(session.userId, userId), lte(session.expiresAt, now)));
}

export async function deleteSession(userId: string, sessionHash: string, conn: Connection = db) {
    await conn.delete(session).where(and(eq(session.userId, userId), eq(session.sessionHash, sessionHash)));
}

export async function insertEmailVerification(
    values: { userId: string; purpose: Purpose; tokenHash: string; expiresAt: Date },
    conn: Connection = db,
) {
    await conn.insert(emailVerification).values(values);
}

export async function findLatestEmailVerification(userId: string, purpose: Purpose, unexpiredAt?: Date, conn: Connection = db) {
    const rows = await conn
        .select()
        .from(emailVerification)
        .where(and(
            eq(emailVerification.userId, userId),
            eq(emailVerification.purpose, purpose),
            unexpiredAt ? gt(emailVerification.expiresAt, unexpiredAt) : undefined,
        ))
        .orderBy(desc(emailVerification.createdAt))
        .limit(1);
    return firstOrNull(rows)
}

export async function incrementEmailCodeAttempts(userId: string, verificationId: string, conn: Connection = db) {
    await conn
        .update(emailVerification)
        .set({ attempts: sql`${emailVerification.attempts} + 1` })
        .where(and(eq(emailVerification.userId, userId), eq(emailVerification.id, verificationId)));
}

export async function deleteEmailVerifications(userId: string, purpose: Purpose, conn: Connection = db) {
    await conn
        .delete(emailVerification)
        .where(and(eq(emailVerification.userId, userId), eq(emailVerification.purpose, purpose)));
}
