import type { NumberValidationParams, StringValidationParams} from "@idlerpg/shared";
import { type Schema, type Validator, validate, type Infer } from "./validate.js";

export function validateNumber(num: unknown, params?: NumberValidationParams): num is number{
    if(typeof num !== "number" || !Number.isFinite(num)) return false
    if(!params) return true

    if(params.lowerBound != undefined && params.lowerBound > num) return false
    if(params.upperBound != undefined && params.upperBound < num) return false
    if(params.wholeNumber && !Number.isInteger(num)) return false

    return true
}

export const STRING_PATTERNS = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$/
}

export function validateString(str: unknown, params?: StringValidationParams): str is string {
  if (typeof str !== "string") return false;
  if (!params) return true;

  if (params.minLength != undefined && str.length < params.minLength) return false;
  if (params.maxLength != undefined && str.length > params.maxLength) return false;
  if (params.pattern != undefined && !params.pattern.test(str)) return false;

  return true;
}

export const num = (params?: NumberValidationParams): Validator<number> =>
    (value) => (validateNumber(value, params) ? value : undefined);

export const str = (params: StringValidationParams = {}): Validator<string> => (value) => {
    if (typeof value !== "string") return undefined;

    let s = params.trim === false ? value : value.trim();
    if (params.lowerCase) s = s.toLowerCase();

    return validateString(s, params) ? s : undefined;
};

export const bool = (): Validator<boolean> =>
    (v) => (typeof v === "boolean" ? v : undefined);

export const oneOf = <T extends string>(...allowed: T[]): Validator<T> =>
    (v) => (typeof v === "string" && (allowed as string[]).includes(v) ? (v as T) : undefined);



export const email = str({ maxLength: 254, lowerCase: true, pattern: STRING_PATTERNS.EMAIL_REGEX });

export const optional = <T>(validator: Validator<T>): Validator<T> & { optional: true } =>
    Object.assign((v: unknown) => validator(v), { optional: true as const });


export const obj = <S extends Schema>(schema: S): Validator<Infer<S>> =>
    (v) => validate(schema, v) ?? undefined;


export const arr = <T>(item: Validator<T>, maxLength = 100): Validator<T[]> => (v) => {
    if (!Array.isArray(v) || v.length > maxLength) return undefined;

    const out: T[] = [];
    for (const x of v) {
        const r = item(x);
        if (r === undefined) return undefined;
        out.push(r);
    }
    return out;
};

