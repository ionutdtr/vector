/**
 * Runtime configuration & startup validation.
 *
 * For a public, multi-user deployment a missing or weak secret must fail LOUD at
 * boot — never silently fall back to a repo-public default. A predictable signing
 * secret would let anyone forge a token for any user, collapsing tenant isolation.
 */
const isProduction = process.env.NODE_ENV === 'production';

const DEV_JWT_FALLBACK = 'dev-insecure-secret-change-me-not-for-production';
const MIN_SECRET_LEN = 32;

let cachedSecret: Uint8Array | null = null;

/**
 * The HS256 signing secret as bytes. In production a strong `JWT_SECRET`
 * (>= 32 chars) is mandatory — this throws otherwise. Outside production it
 * falls back to a well-known dev string so local work just runs.
 */
export function jwtSecret(): Uint8Array {
  if (cachedSecret) return cachedSecret;
  const raw = process.env.JWT_SECRET;

  if (!raw || raw.length < MIN_SECRET_LEN) {
    if (isProduction) {
      throw new Error(
        `JWT_SECRET is missing or too weak (needs >= ${MIN_SECRET_LEN} chars). ` +
          'Set a long random string before deploying — tokens are forgeable without it.',
      );
    }
    console.warn(
      '[vector] JWT_SECRET unset/weak — using an INSECURE dev fallback. Never deploy like this.',
    );
    cachedSecret = new TextEncoder().encode(raw && raw.length ? raw : DEV_JWT_FALLBACK);
    return cachedSecret;
  }

  cachedSecret = new TextEncoder().encode(raw);
  return cachedSecret;
}

/**
 * Validate everything required to serve traffic. Call once at boot so a
 * misconfigured production deploy dies immediately instead of at first request.
 */
export function assertRuntimeConfig(): void {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
  }
  jwtSecret(); // throws in production when the secret is missing/weak

  // Email is required for real verification / password reset. Warn (don't throw)
  // so a deploy can defer it — without a key, codes are logged, not emailed.
  if (isProduction && !process.env.RESEND_API_KEY) {
    console.warn(
      '[vector] RESEND_API_KEY unset in production — verification/reset codes are logged, not emailed.',
    );
  }
}

export const config = { isProduction } as const;
