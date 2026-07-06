import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface IpsRule {
  id: string;
  code: string;
  statement: string;
  kind: 'hard_limit' | 'principle';
  params: Record<string, unknown> | null;
  isActive: boolean;
  sortOrder: number;
}

export function useIps() {
  return useQuery({
    queryKey: queryKeys.ips,
    queryFn: () => api.get<{ rules: IpsRule[] }>('/ips').then((r) => r.rules),
  });
}

export function useToggleIpsRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.patch<{ rule: IpsRule }>(`/ips/${id}`, { isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.ips }),
  });
}
