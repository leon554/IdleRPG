import { randomInt, createHmac, timingSafeEqual } from "node:crypto";

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