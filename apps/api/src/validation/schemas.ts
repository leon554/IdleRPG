import { type Schema} from "./validate.js"
import { email, str, optional, num } from "./typeValidation.js"

export const signUpSchema = {
    userName: str({ minLength: 1, maxLength: 50 }),
    email,
    password: str({ minLength: 8, maxLength: 128, trim: false }),
    age: optional(num({ lowerBound: 13, upperBound: 120, wholeNumber: true })),
} satisfies Schema