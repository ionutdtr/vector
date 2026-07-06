import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

export type ReviewPeriod = 'weekly' | 'monthly' | 'quarterly';

export interface Review {
  id: string;
  period: string;
  periodStart: string;
  periodEnd: string;
  headline: string;
  narrative: string;
  improved: string[];
  worsened: string[];
  actions: string[];
  createdAt: string;
}

export function useLatestReview(period: ReviewPeriod) {
  return useQuery({
    queryKey: ['reviews', period],
    queryFn: () =>
      api
        .get<{ review: Review | null }>(`/reviews/latest?period=${period}`)
        .then((r) => r.review),
  });
}

export function useGenerateReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (period: ReviewPeriod) =>
      api
        .post<{ review: Review }>('/reviews', { period })
        .then((r) => r.review),
    onSuccess: (_data, period) =>
      qc.invalidateQueries({ queryKey: ['reviews', period] }),
  });
}
