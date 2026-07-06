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

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AccountInput) =>
      api.post<{ account: Account }>('/accounts', input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.networth });
    },
  });
}
