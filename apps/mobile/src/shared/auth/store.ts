import * as LocalAuthentication from 'expo-local-authentication';
import { create } from 'zustand';
import { queryClient } from '../query';
import { clearToken, loadToken, loadUser, saveToken, saveUser } from './token';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string;
}

type Status = 'loading' | 'authed' | 'guest' | 'locked';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
  unlock: () => Promise<void>;
}

async function biometricAvailable(): Promise<boolean> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return hasHardware && enrolled;
  } catch {
    return false;
  }
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  hydrate: async () => {
    const token = await loadToken();
    if (!token) {
      set({ status: 'guest' });
      return;
    }
    // Restore the persisted user so a cold start doesn't leave `user` null.
    const user = await loadUser();
    // A stored session: require biometric unlock if the device supports it.
    const bio = await biometricAvailable();
    set({ status: bio ? 'locked' : 'authed', user });
  },
  signIn: async (token, user) => {
    // Drop any cached data from a previous session before the new user's queries
    // run — prevents cross-user data bleed on a shared device.
    queryClient.clear();
    await saveToken(token);
    await saveUser(user);
    set({ status: 'authed', user });
  },
  signOut: async () => {
    await clearToken();
    queryClient.clear();
    set({ status: 'guest', user: null });
  },
  unlock: async () => {
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Deblochează Vector',
      fallbackLabel: 'Folosește codul',
    });
    if (res.success) set({ status: 'authed' });
  },
}));
