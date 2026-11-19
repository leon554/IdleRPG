import type { db } from "../db/index.js";

// A drizzle transaction handle, as passed to the db.transaction callback
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
