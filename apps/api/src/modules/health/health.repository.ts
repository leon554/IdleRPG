import { sql } from "drizzle-orm";
import { db } from "../../db/index.js";

export async function pingDatabase(): Promise<boolean> {
    try {
        await db.execute(sql`select 1`);
        return true;
    } catch {
        return false;
    }
}
