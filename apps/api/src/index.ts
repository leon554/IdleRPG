import cors from 'cors';
import express from 'express';
import { sql } from 'drizzle-orm';
import type { HealthResponse } from '@idlerpg/shared';
import { db } from './db/index.js';
import { env } from './env.js';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
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

app.listen(env.port, '0.0.0.0', () => {
  console.log(`API listening on port ${env.port}`);
});
