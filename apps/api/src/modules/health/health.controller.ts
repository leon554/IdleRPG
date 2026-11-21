import type { RequestHandler } from "express";
import type { HealthResponse } from "@idlerpg/shared";
import * as healthRepo from "./health.repository.js";

export const getHealth: RequestHandler = async (_req, res) => {
    const dbUp = await healthRepo.pingDatabase();

    const body: HealthResponse = {
        status: dbUp ? 'ok' : 'error',
        db: dbUp ? 'up' : 'down',
        timestamp: new Date().toISOString(),
    };

    res.status(dbUp ? 200 : 503).json(body);
};
