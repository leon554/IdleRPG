export type HealthResponse = {
  status: 'ok' | 'error';
  db: 'up' | 'down';
  timestamp: string;
};
