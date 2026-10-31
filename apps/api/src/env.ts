import path from 'node:path';
import { config } from 'dotenv';

// Docker Compose injects env vars directly; dotenv never overrides those.
config({ path: path.resolve(import.meta.dirname, '../../../.env'), quiet: true });

function required(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var: ${name}`);
    return value;
}

export const env = {
    port: Number(process.env.API_PORT ?? 3000),
    databaseUrl: required('DATABASE_URL'),
};
