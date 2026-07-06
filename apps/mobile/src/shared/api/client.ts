/**
 * Typed API client. Talks to the Vector backend (apps/api).
 *
 * Base URL: set EXPO_PUBLIC_API_URL. Defaults to localhost:3000 (iOS simulator
 * shares the host network). For a physical iPhone, set it to your Mac's LAN IP.
 *
 * Auth: a dev-only user id until Neon Auth is wired (Phase 9). Replaced by the
 * Stack Auth token in the Authorization header at that point.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';
const DEV_USER_ID = '00000000-0000-0000-0000-000000000001';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-debug-user-id': DEV_USER_ID,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
};
