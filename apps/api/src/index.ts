import cors from 'cors';
import express, { Router } from 'express';
import { sql } from 'drizzle-orm';
import type { HealthResponse } from '@idlerpg/shared';
import { db } from './db/index.js';
import { env } from './env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { errorHandler } from './errorHandler.js';
import { gameDataRouter } from './routes/gameData/recipes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter)
app.use("/api/auth", authRouter)
app.use("/api/gamedata", gameDataRouter)

app.use(errorHandler)

app.listen(env.port, '0.0.0.0', () => {
    console.log(`API listening on port ${env.port}`);
});

