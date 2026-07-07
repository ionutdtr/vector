/**
 * Defensive haptics. expo-haptics is a NATIVE module: on a dev client that
 * hasn't been rebuilt since it was added, `require()` still returns the JS shim,
 * so the module *looks* present — but calling `selectionAsync()` returns a
 * REJECTED promise ("not available on iOS, linked native deps?"). A sync
 * try/catch can't catch that, so we must catch the promise rejection too, and
 * after the first failure we disable haptics for the session so it never spams
 * again. Once the app is rebuilt (`expo prebuild` / `expo run:ios`) the calls
 * resolve normally and haptics stay enabled.
 */
type HapticsModule = {
  selectionAsync?: () => Promise<void>;
  impactAsync?: (style?: unknown) => Promise<void>;
  ImpactFeedbackStyle?: { Light?: unknown; Medium?: unknown };
};

let mod: HapticsModule | null = null;
let tried = false;
let disabled = false;
// User preference (Settings → Haptics), separate from the native-availability
// kill switch above. Both must be true for a tick to fire. Hydrated at startup.
let userEnabled = true;

/** Settings toggle → gate every haptic without touching each call site. */
export function setHapticsEnabled(on: boolean): void {
  userEnabled = on;
}

export function areHapticsEnabled(): boolean {
  return userEnabled;
}

function get(): HapticsModule | null {
  if (disabled || !userEnabled) return null;
  if (!tried) {
    tried = true;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      mod = require('expo-haptics');
    } catch {
      mod = null;
    }
  }
  return mod;
}

/** Swallow a possibly-rejecting haptics promise and disable on failure. */
function guard(p: Promise<void> | undefined): void {
  if (p && typeof p.then === 'function') {
    p.then(undefined, () => {
      disabled = true;
    });
  }
}

/** Light tick for taps, tab switches, toggles. */
export function selectionTick(): void {
  try {
    guard(get()?.selectionAsync?.());
  } catch {
    disabled = true;
  }
}

/** A slightly firmer bump for primary actions (add event, confirm). */
export function impactLight(): void {
  const m = get();
  try {
    guard(m?.impactAsync?.(m.ImpactFeedbackStyle?.Light));
  } catch {
    disabled = true;
  }
}
