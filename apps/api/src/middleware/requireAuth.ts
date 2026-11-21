import type { RequestHandler, Response } from "express";
import { and, eq, gt } from "drizzle-orm";
import { db } from "../db/index.js";
import { session, users } from "../db/schema.js";
import { SESSION_EXPIRATION, TOKEN_LENGTH, REFRESH_AFTER } from "../constants.js";
import { hashSessionToken } from "../util/authUtil/sessionToken.js";
import { type AuthRow, type AuthUser } from "@idlerpg/shared";
import { unauthorized } from "../shared/errors.js";          

export const requireAuth: RequestHandler = async (req, res, next) => {
    const header = req.get("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    if (!token || token.length !== TOKEN_LENGTH) throw unauthorized();

    const now = new Date();

    const [row]: AuthRow[] = await db
        .select({
            sessionId: session.id,
            expiresAt: session.expiresAt,
            id: users.id,
            emailVerifiedAt: users.emailVerifiedAt,
        })
        .from(session)
        .innerJoin(users, eq(users.id, session.userId))
        .where(and(eq(session.sessionHash, hashSessionToken(token)), gt(session.expiresAt, now)))
        .limit(1);

    if (!row) throw unauthorized();

    await refreshSession(row, now)

    res.locals.user = { id: row.id, emailVerifiedAt: row.emailVerifiedAt } satisfies AuthUser;
    res.locals.sessionId = row.sessionId;
    next();
};

async function refreshSession(row: AuthRow, now: Date){
    if (row.expiresAt.getTime() - now.getTime() < SESSION_EXPIRATION - REFRESH_AFTER) {
        await db
            .update(session)
            .set({ expiresAt: new Date(now.getTime() + SESSION_EXPIRATION), lastUsedAt: now })
            .where(eq(session.id, row.sessionId));
    }
}

export function getAuthUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}