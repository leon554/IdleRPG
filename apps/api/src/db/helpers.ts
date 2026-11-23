import { sql } from "drizzle-orm";
import type { Connection } from "../types/db.js";

// Returns the first row of a query, or null when there are no rows.
// Use this instead of `const [row] = await …`: without noUncheckedIndexedAccess, TypeScript types
// `row` as always defined, so callers aren't forced to handle "not found".
export function firstOrNull<T>(rows: T[]): T | null {
    return rows.length > 0 ? rows[0] : null;
}

// Serialises a user's state-changing transactions (starting tasks, equipping) so their checks can't race:
// held until the transaction ends. Every transaction that must not interleave for a user takes it first.
export async function lockUser(userId: string, conn: Connection) {
    await conn.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}
