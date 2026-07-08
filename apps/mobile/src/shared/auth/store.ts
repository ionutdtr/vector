import { create } from 'zustand';
import { queryClient } from '../query';
import { clearToken, loadToken, loadUser, saveToken, saveUser } from './token';

// Biometric unlock is an optional capability. On a stale or partial native
// binary — or a device with no biometric hardware — the module's native side can
// be absent, and requiring it throws "Cannot find native module" at eval time.
// Every screen imports this store, so an unguarded import white-screens the whole
// app. Guard the load: a missing module simply degrades to "no lock".
let LocalAuthentication: typeof import('expo-local-authentication') | null = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {
  LocalAuthentication = null;
}

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
  if (!LocalAuthentication) return false;
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
    if (!LocalAuthentication) {
      // No biometric module in this binary — nothing to authenticate against.
      set({ status: 'authed' });
      return;
    }
    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Deblochează Vector',
      fallbackLabel: 'Folosește codul',
    });
    if (res.success) set({ status: 'authed' });
  },
}));
