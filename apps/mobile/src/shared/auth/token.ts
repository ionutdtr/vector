import * as SecureStore from 'expo-secure-store';

const KEY = 'vector.token';

// In-memory mirror so the (non-React) API client can read the token synchronously.
let current: string | null = null;

export function getToken(): string | null {
  return current;
}

export async function loadToken(): Promise<string | null> {
  current = await SecureStore.getItemAsync(KEY);
  return current;
}

export async function saveToken(token: string): Promise<void> {
  current = token;
  await SecureStore.setItemAsync(KEY, token);
}

export async function clearToken(): Promise<void> {
  current = null;
  await SecureStore.deleteItemAsync(KEY);
}
