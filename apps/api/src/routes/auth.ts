import type { SignUpBody } from "@idlerpg/shared";
import { Router } from "express";
import { validate } from "../validation/validate.js";
import { signUpSchema } from "../validation/schemas.js";

export const authRouter = Router()

authRouter.post("/signup", (req, res) => {
    const data = validate(signUpSchema, req.body)
    if (!data) return res.status(400).json({ error: "invalid_input" });


})