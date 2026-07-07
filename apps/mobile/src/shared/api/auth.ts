import type { AuthUser } from '../auth/store';
import { api } from './client';

export function login(email: string, password: string) {
  return api.post<{ token: string; user: AuthUser }>('/auth/login', {
    email,
    password,
  });
}

export function register(
  email: string,
  password: string,
  firstName: string,
  baseCurrency?: string,
) {
  return api.post<{ token: string; user: AuthUser }>('/auth/register', {
    email,
    password,
    firstName,
    ...(baseCurrency ? { baseCurrency } : {}),
  });
}

/** Verify the signed-in user's email with the emailed 6-digit code. */
export function verifyEmail(code: string) {
  return api.post<{ ok: boolean; emailVerified: boolean }>('/verify-email', {
    code,
  });
}

/** Re-send the verification code to the signed-in user. */
export function resendVerification() {
  return api.post<{ ok: boolean }>('/resend-verification', {});
}

/** Request a password-reset code (always succeeds — no account enumeration). */
export function forgotPassword(email: string) {
  return api.post<{ ok: boolean }>('/auth/forgot-password', { email });
}

/** Complete a password reset with the emailed code. */
export function resetPassword(email: string, code: string, password: string) {
  return api.post<{ ok: boolean }>('/auth/reset-password', {
    email,
    code,
    password,
  });
}
