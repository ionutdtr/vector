import { create } from 'zustand';
import { clearToken, loadToken, saveToken } from './token';

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string;
}

type Status = 'loading' | 'authed' | 'guest';

interface AuthState {
  status: Status;
  user: AuthUser | null;
  hydrate: () => Promise<void>;
  signIn: (token: string, user: AuthUser) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  status: 'loading',
  user: null,
  hydrate: async () => {
    const token = await loadToken();
    set({ status: token ? 'authed' : 'guest' });
  },
  signIn: async (token, user) => {
    await saveToken(token);
    set({ status: 'authed', user });
  },
  signOut: async () => {
    await clearToken();
    set({ status: 'guest', user: null });
  },
}));
