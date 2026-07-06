import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface Account {
  id: string;
  domain: 'personal' | 'business';
  name: string;
  type: string;
  accountClass: 'asset' | 'liability';
  currency: string;
  currentBalance: string;
  institution: string | null;
  isLiquid: boolean;
  isArchived: boolean;
  sortOrder: number;
}

export interface AccountInput {
  domain: 'personal' | 'business';
  name: string;
  type: string;
  currency?: string;
  currentBalance?: number;
  institution?: string;
  isLiquid?: boolean;
}

export function useAccounts() {
  return useQuery({
    queryKey: queryKeys.accounts,
    queryFn: () =>
      api.get<{ accounts: Account[] }>('/accounts').then((r) => r.accounts),
  });
}

export interface AccountUpdate {
  name?: string;
  currentBalance?: number;
  isLiquid?: boolean;
  isArchived?: boolean;
}

function useAccountInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.accounts });
    qc.invalidateQueries({ queryKey: queryKeys.networth });
    qc.invalidateQueries({ queryKey: queryKeys.briefing });
    qc.invalidateQueries({ queryKey: queryKeys.discipline });
  };
}

export function useCreateAccount() {
  const invalidate = useAccountInvalidate();
  return useMutation({
    mutationFn: (input: AccountInput) =>
      api.post<{ account: Account }>('/accounts', input),
    onSuccess: invalidate,
  });
}

export function useUpdateAccount() {
  const invalidate = useAccountInvalidate();
  return useMutation({
    mutationFn: (vars: { id: string; patch: AccountUpdate }) =>
      api.patch<{ account: Account }>(`/accounts/${vars.id}`, vars.patch),
    onSuccess: invalidate,
  });
}

export function useDeleteAccount() {
  const invalidate = useAccountInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/accounts/${id}`),
    onSuccess: invalidate,
  });
}
