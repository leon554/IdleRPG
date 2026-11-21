import type { db } from "../db/index.js";

export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
export type Connection = typeof db | Tx