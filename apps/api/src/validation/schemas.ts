import { type Schema} from "./validate.js"
import { email, str, optional, num } from "./typeValidation.js"

export const signUpSchema = {
    userName: str({ minLength: 1, maxLength: 50 }),
    email,
    password: str({ minLength: 8, maxLength: 128, trim: false }),
} satisfies Schema

export const emailVerificationSchema = {
    emailCode: str({minLength: 0, maxLength: 7}),
} satisfies Schema


export const loginSchema = {
    email,
    password: str({ minLength: 8, maxLength: 128, trim: false }),
} satisfies Schema