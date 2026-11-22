import cors from 'cors';
import express from 'express';
import { env } from './env.js';
import { errorHandler } from './errorHandler.js';
import { healthRouter } from './modules/health/health.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { catalogRouter } from './modules/catalog/catalog.routes.js';
import { statsRouter } from './modules/stats/stats.routes.js';
import { taskRouter } from './modules/task/task.routes.js';
import { inventoryRouter } from './modules/inventory/inventory.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/health", healthRouter)
app.use("/api/auth", authRouter)
// Game data: static catalog plus the player's stats and tasks
app.use("/api/gamedata", catalogRouter, statsRouter, taskRouter, inventoryRouter)

app.use(errorHandler)

app.listen(env.port, '0.0.0.0', () => {
    console.log(`API listening on port ${env.port}`);
});

