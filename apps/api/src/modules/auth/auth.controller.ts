import type { RequestHandler } from "express";
import { getAuthUser } from "../../middleware/requireAuth.js";
import { withBody } from "../../validation/validate.js";
import { emailVerificationSchema, loginSchema, signUpSchema } from "./auth.schemas.js";
import * as authService from "./auth.service.js";

export const signUp = withBody(signUpSchema, async (body, _req, res) => {
    res.status(201).json(await authService.signUp(body));
});

export const verifyEmailCode = withBody(emailVerificationSchema, async (body, _req, res) => {
    res.status(200).json(await authService.verifyEmailCode(getAuthUser(res), body.emailCode));
});

export const logIn = withBody(loginSchema, async (body, _req, res) => {
    res.status(200).json(await authService.logIn(body.email, body.password));
});

export const getUser: RequestHandler = async (_req, res) => {
    res.status(200).json(await authService.getUser(getAuthUser(res).id));
};

export const sendNewEmailCode: RequestHandler = async (_req, res) => {
    res.status(200).json(await authService.sendNewEmailCode(getAuthUser(res)));
};

export const logOut: RequestHandler = async (req, res) => {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, "") ?? "";
    res.status(200).json(await authService.logOut(getAuthUser(res).id, token));
};
