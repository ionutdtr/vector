import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { setHapticsEnabled } from '@shared/lib/haptics';

/**
 * Local device preferences. Persisted with the same defensive SecureStore
 * pattern as the auth token — a storage failure (native module not linked)
 * must never crash startup; it just falls back to the default.
 */
const HAPTICS_KEY = 'vector.prefs.haptics';

interface PrefsState {
  haptics: boolean;
  hydrate: () => Promise<void>;
  setHaptics: (on: boolean) => Promise<void>;
}

export const usePrefs = create<PrefsState>((set) => ({
  haptics: true,
  hydrate: async () => {
    let on = true;
    try {
      const raw = await SecureStore.getItemAsync(HAPTICS_KEY);
      on = raw == null ? true : raw === '1';
    } catch {
      on = true;
    }
    setHapticsEnabled(on);
    set({ haptics: on });
  },
  setHaptics: async (on) => {
    // Apply immediately so the confirming tick (if turning on) fires this frame.
    setHapticsEnabled(on);
    set({ haptics: on });
    try {
      await SecureStore.setItemAsync(HAPTICS_KEY, on ? '1' : '0');
    } catch {
      // ignore — the in-memory state is already correct for this session
    }
  },
}));
