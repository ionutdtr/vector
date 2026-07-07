import { useAuth } from '../auth/store';
import { getToken } from '../auth/token';

/**
 * Typed API client. Talks to the Vector backend (apps/api).
 *
 * Base URL: set EXPO_PUBLIC_API_URL. Defaults to localhost:3000 (iOS simulator
 * shares the host network). For a physical iPhone, set it to your Mac's LAN IP.
 *
 * Auth: the self-hosted JWT (from expo-secure-store) is sent as a Bearer token.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });
  // An authenticated request that comes back 401 means the token expired or was
  // revoked — sign out so the root layout routes back to the auth screen, instead
  // of every screen showing a raw "API 401" error. (Login/register failures carry
  // no token, so they aren't caught here.)
  if (res.status === 401 && token) {
    void useAuth.getState().signOut();
  }
  if (!res.ok) {
    throw new Error(`API ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
