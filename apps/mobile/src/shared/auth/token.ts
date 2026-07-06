import * as SecureStore from 'expo-secure-store';

const KEY = 'vector.token';

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
  } catch {
    // ignore — in-memory mirror is already cleared
  }
}
