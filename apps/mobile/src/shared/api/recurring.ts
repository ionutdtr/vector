import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface RecurringRecord {
  id: string;
  domain: 'personal' | 'business';
  type: string;
  title: string;
  amount: string;
  currency: string;
  cadence: string;
  nextOccurrence: string;
  isActive: boolean;
  accountId: string | null;
}

export interface RecurringInput {
  domain: 'personal' | 'business';
  type: string;
  title: string;
  amount: number;
  currency?: string;
  cadence: 'monthly' | 'weekly' | 'yearly' | 'every_28d';
  nextOccurrence: string;
  accountId?: string;
}

export function useRecurring() {
  return useQuery({
    queryKey: queryKeys.recurring,
    queryFn: () =>
      api
        .get<{ recurring: RecurringRecord[] }>('/recurring')
        .then((r) => r.recurring),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.recurring });
    qc.invalidateQueries({ queryKey: queryKeys.briefing });
  };
}

export function useCreateRecurring() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: RecurringInput) =>
      api.post<{ recurring: RecurringRecord }>('/recurring', input),
    onSuccess: invalidate,
  });
}

export function useDeleteRecurring() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/recurring/${id}`),
    onSuccess: invalidate,
  });
}
