import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface Insight {
  id: string;
  kind: 'insight' | 'recommendation' | 'warning' | 'forecast' | 'achievement';
  title: string;
  body: string;
  severity: 'info' | 'warn' | 'critical';
  ruleCode: string | null;
  eventId: string | null;
  createdAt: string;
}

export function useInsights() {
  return useQuery({
    queryKey: queryKeys.insights,
    queryFn: () =>
      api.get<{ insights: Insight[] }>('/insights').then((r) => r.insights),
  });
}
