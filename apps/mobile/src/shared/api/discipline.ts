import { useQuery } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface Discipline {
  score: number;
  delta: number;
  components: Record<string, number>;
  explanation: string;
  capturedOn: string;
}

export function useDiscipline() {
  return useQuery({
    queryKey: queryKeys.discipline,
    queryFn: () =>
      api
        .get<{ discipline: Discipline }>('/discipline')
        .then((r) => r.discipline),
    staleTime: 1000 * 60 * 30,
  });
}
