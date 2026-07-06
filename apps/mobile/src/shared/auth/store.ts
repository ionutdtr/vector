import * as LocalAuthentication from 'expo-local-authentication';
import { create } from 'zustand';
import { clearToken, loadToken, saveToken } from './token';

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
    // A stored session: require biometric unlock if the device supports it.
    const bio = await biometricAvailable();
    set({ status: bio ? 'locked' : 'authed' });
  },
  signIn: async (token, user) => {
    await saveToken(token);
    set({ status: 'authed', user });
  },
  signOut: async () => {
    await clearToken();
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
