import * as SecureStore from 'expo-secure-store';
import type { AuthUser } from './store';

const KEY = 'vector.token';
const USER_KEY = 'vector.user';

// In-memory mirror so the (non-React) API client can read the token synchronously.
let current: string | null = null;

export function getToken(): string | null {
  return current;
}

export async function loadToken(): Promise<string | null> {
  // Never let a storage failure (e.g. native module not linked) crash startup.
  try {
    current = await SecureStore.getItemAsync(KEY);
  } catch {
    current = null;
  }
  return current;
}

export async function saveToken(token: string): Promise<void> {
  current = token;
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  current = null;
  try {
    await SecureStore.deleteItemAsync(KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
  } catch {
    // ignore — in-memory mirror is already cleared
  }
}

export async function saveUser(user: AuthUser): Promise<void> {
  try {
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
  } catch {
    // best-effort — a failed persist just means the greeting reloads from the API
  }
}

export async function loadUser(): Promise<AuthUser | null> {
  try {
    const raw = await SecureStore.getItemAsync(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}
