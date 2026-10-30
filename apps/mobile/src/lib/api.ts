import type { HealthResponse } from '@idlerpg/shared';

export const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/health`);
  return (await res.json()) as HealthResponse;
}
