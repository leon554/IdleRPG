import { type Schema} from "./validate.js"
import { email, str, optional, num, arrayOf, int, object } from "./typeValidation.js"
import { MAX_TASK_ACTIONS } from "../constants.js"

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

export const gatherTaskSchema = {
    gatheringGroupId: str(),
    actionIds: arrayOf(str(), 1, MAX_TASK_ACTIONS),
} satisfies Schema

export const craftTaskSchema = {
    recipeId: str(),
    craftCount: int(1, Infinity),
    actionIds: arrayOf(str(), 1, MAX_TASK_ACTIONS),
    inputs: optional(arrayOf(object({ resourceId: str(), rarityId: str() }), 0, 50)),
} satisfies Schema
