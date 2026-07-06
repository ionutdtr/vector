import type { AuthUser } from '../auth/store';
import { api } from './client';

export function login(email: string, password: string) {
  return api.post<{ token: string; user: AuthUser }>('/auth/login', {
    email,
    password,
  });
}

export function register(email: string, password: string, firstName: string) {
  return api.post<{ token: string; user: AuthUser }>('/auth/register', {
    email,
    password,
    firstName,
  });
}
