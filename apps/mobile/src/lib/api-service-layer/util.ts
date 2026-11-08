import { getToken, clearToken } from "@/auth/token";

const API_URL = process.env.EXPO_PUBLIC_API_URL;
if (!API_URL) throw new Error("EXPO_PUBLIC_API_URL is not set");

const TIMEOUT_MS = 15_000;

export class ApiError extends Error {
    constructor(
        public code: string,                       
        public status: number,                    
        public body: Record<string, unknown> = {}, 
    ) {
        super(code);
    }
}

let onUnauthorized: (() => void) | null = null;
export function setUnauthorizedHandler(handler: (() => void) | null) {
    onUnauthorized = handler;
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await getToken();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

    let res: Response;
    try {
        res = await fetch(`${API_URL}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(init.headers as Record<string, string> | undefined),
        },
        });
    } catch {
        throw new ApiError(controller.signal.aborted ? "timeout" : "network_error", 0);
    } finally {
        clearTimeout(timer);
    }

    const body = await res.json().catch(() => ({}));

    if (res.status === 401 && token) {
        await clearToken();
        onUnauthorized?.();
    }

    if (!res.ok) {
        throw new ApiError(body.error ?? "internal_error", res.status, body);
    }

    return body as T;
}