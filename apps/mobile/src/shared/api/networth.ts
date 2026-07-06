import { useQuery } from '@tanstack/react-query';
import { api } from './client';

export interface NetWorthAccount {
  id: string;
  name: string;
  domain: 'personal' | 'business';
  type: string;
  class: 'asset' | 'liability';
  balance: number;
  currency: string;
  isLiquid: boolean;
}

export interface NetWorthTrend {
  d1: number | null;
  d7: number | null;
  d30: number | null;
  series: Array<{ date: string; total: number }>;
}

export interface NetWorth {
  base: string;
  total: number;
  personal: number;
  business: number;
  liquid: number;
  accounts: NetWorthAccount[];
  trend?: NetWorthTrend;
}

export function useNetWorth() {
  return useQuery({
    queryKey: ['networth'],
    queryFn: () => api.get<NetWorth>('/networth'),
  });
}
