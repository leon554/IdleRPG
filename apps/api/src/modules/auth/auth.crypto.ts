import bcrypt from "bcrypt";
import { randomBytes, createHash, randomInt, createHmac, timingSafeEqual } from "node:crypto";


const SALT_ROUNDS = 12;
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  return bcrypt.compare(password, stored);
}


export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
export function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}



const CODE_SECRET = process.env.CODE_SECRET!;

export function generateEmailCode(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export function hashEmailCode(code: string): string {
  return createHmac("sha256", CODE_SECRET).update(code).digest("hex");
}

export function emailCodesMatch(code: string, storedHash: string): boolean {
  const a = Buffer.from(hashEmailCode(code), "hex");
  const b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}
