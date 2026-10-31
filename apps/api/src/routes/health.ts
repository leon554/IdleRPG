import { Router } from "express";
import type { HealthResponse } from "@idlerpg/shared";
import { db } from "../db/index.js";
import { sql } from "drizzle-orm";

export const healthRouter = Router()

healthRouter.get('/health', async (_req, res) => {
    let dbUp = true;

    try {
        await db.execute(sql`select 1`);
    } catch {
        dbUp = false;
    }

    const body: HealthResponse = {
        status: dbUp ? 'ok' : 'error',
        db: dbUp ? 'up' : 'down',
        timestamp: new Date().toISOString(),
    };
    
    res.status(dbUp ? 200 : 503).json(body);
});