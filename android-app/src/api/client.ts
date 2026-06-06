import { API_BASE_URL } from '../config';

// Single source of truth for the backend base URL (no Expo env, no old-project
// fallback). Every network call goes through request() below.
const BASE_URL = API_BASE_URL;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  timeoutMs?: number;
  signal?: AbortSignal;
  /** When set, sent as `Authorization: Bearer <token>`. */
  token?: string;
};

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, timeoutMs = 30000, signal, token } = opts;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const linkedSignal = signal
    ? linkSignals(controller.signal, signal)
    : controller.signal;
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: linkedSignal,
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json?.success === false) {
      // Content routes return { message }, auth routes return { error }.
      const msg = json?.message || json?.error || `Request failed (${res.status})`;
      throw new ApiError(msg, res.status);
    }
    return (json?.data ?? json) as T;
  } finally {
    clearTimeout(timer);
  }
}

function linkSignals(a: AbortSignal, b: AbortSignal): AbortSignal {
  if (a.aborted) return a;
  if (b.aborted) return b;
  const c = new AbortController();
  const onAbort = () => c.abort();
  a.addEventListener('abort', onAbort, { once: true });
  b.addEventListener('abort', onAbort, { once: true });
  return c.signal;
}

export const apiBaseURL = BASE_URL;
