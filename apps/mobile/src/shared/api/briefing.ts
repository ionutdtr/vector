import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface UpcomingItem {
  title: string;
  amount: number;
  in_days: number;
}

export interface Briefing {
  firstName: string;
  baseCurrency: string;
  upcoming: UpcomingItem[];
  smokingMonth: number;
  recurringMonthly: number;
}

export function useBriefing() {
  return useQuery({
    queryKey: queryKeys.briefing,
    queryFn: () => api.get<Briefing>('/briefing'),
    staleTime: 1000 * 60 * 10,
  });
}
