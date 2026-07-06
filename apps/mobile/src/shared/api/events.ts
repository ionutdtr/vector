import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface EventRecord {
  id: string;
  domain: 'personal' | 'business';
  type: string;
  title: string;
  amount: string;
  currency: string;
  baseAmount: string;
  occurredAt: string;
  category: string | null;
  note: string | null;
  accountId: string | null;
}

export interface EventInput {
  domain: 'personal' | 'business';
  type: string;
  title: string;
  amount: number;
  currency?: string;
  occurredAt: string;
  accountId?: string;
  counterAccountId?: string;
  category?: string;
  note?: string;
}

export function useEvents() {
  return useQuery({
    queryKey: queryKeys.events,
    queryFn: () =>
      api.get<{ events: EventRecord[] }>('/events').then((r) => r.events),
  });
}

export function useCreateEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: EventInput) =>
      api.post<{ event: EventRecord }>('/events', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.networth });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.insights });
      qc.invalidateQueries({ queryKey: queryKeys.discipline });
      qc.invalidateQueries({ queryKey: queryKeys.briefing });
    },
  });
}

export function useDeleteEvent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/events/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.networth });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.insights });
      qc.invalidateQueries({ queryKey: queryKeys.discipline });
      qc.invalidateQueries({ queryKey: queryKeys.briefing });
    },
  });
}
