import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface Me {
  id: string;
  email: string | null;
  firstName: string;
  baseCurrency: string;
  timezone?: string;
  emailVerified: boolean;
  onboardedAt: string | null;
}

/** The signed-in user's profile — source of truth for email-verified status. */
export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api.get<{ user: Me }>('/me').then((r) => r.user),
    staleTime: 1000 * 60,
  });
}
