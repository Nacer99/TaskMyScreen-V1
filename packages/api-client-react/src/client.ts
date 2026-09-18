/**
 * Thin fetch wrapper around the TaskMyScreen REST API.
 *
 * Auth: every request carries the Clerk session token as a Bearer header
 * (see hooks.ts — each hook resolves the token via Clerk's `useAuth().getToken()`
 * and passes it in here). The backend is the sole source of truth; this client
 * never makes authorization decisions itself.
 */

const API_BASE = (import.meta.env.VITE_API_BASE_URL ?? "/tms-api").replace(/\/$/, "");

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export type GetToken = () => Promise<string | null>;

export async function apiRequest<T>(
  path: string,
  opts: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    getToken: GetToken;
  }
): Promise<T> {
  const token = await opts.getToken();

  const res = await fetch(`${API_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    credentials: "include",
  });

  if (!res.ok) {
    let payload: { error?: string; message?: string; details?: unknown } | undefined;
    try {
      payload = await res.json();
    } catch {
      // non-JSON error body — fall back to statusText
    }
    throw new ApiError(
      res.status,
      payload?.message ?? payload?.error ?? res.statusText,
      payload?.details
    );
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
