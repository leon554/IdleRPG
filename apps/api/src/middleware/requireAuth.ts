import type { RequestHandler, Response } from "express";
import type { AuthUser } from "@idlerpg/shared";
import { authenticate } from "../modules/auth/auth.service.js";

export const requireAuth: RequestHandler = async (req, res, next) => {
    const header = req.get("Authorization");
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;

    const { user, sessionId } = await authenticate(token);

    res.locals.user = user satisfies AuthUser;
    res.locals.sessionId = sessionId;
    next();
};

export function getAuthUser(res: Response): AuthUser {
  return res.locals.user as AuthUser;
}
