import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface Recommendation {
  id: string;
  title: string;
  body: string;
  ruleCode: string | null;
}

export function useRecommendation() {
  return useQuery({
    queryKey: ['ai', 'recommend'],
    queryFn: () =>
      api
        .post<{ recommendation: Recommendation }>('/ai/recommend', {})
        .then((r) => r.recommendation),
    retry: false,
    staleTime: 1000 * 60 * 60 * 6,
  });
}

export interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useChat() {
  return useQuery({
    queryKey: ['ai', 'chat'],
    queryFn: () =>
      api.get<{ threadId: string | null; messages: ChatMessage[] }>('/ai/chat'),
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { message: string; threadId?: string | null }) =>
      api.post<{ threadId: string; reply: string; logged?: boolean }>(
        '/ai/chat',
        {
          message: vars.message,
          threadId: vars.threadId ?? undefined,
        },
      ),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['ai', 'chat'] });
      // A message can log an event — refresh everything money-related.
      if (data.logged) {
        for (const key of [
          queryKeys.events,
          queryKeys.networth,
          queryKeys.accounts,
          queryKeys.insights,
          queryKeys.discipline,
          queryKeys.briefing,
        ]) {
          qc.invalidateQueries({ queryKey: key });
        }
      }
    },
  });
}

export type Verdict = 'yes' | 'no' | 'wait' | 'conditional';

export interface Simulation {
  verdict: Verdict;
  reason: string;
  impact: {
    liquidity: { before: number; after: number; floor: number; breaches: boolean };
    net_worth: { delta: number };
    goal_shift?: { name: string; date_shift_days: number };
    investments: { delta_trajectory: number };
  };
  rules_touched: string[];
  alternative?: string;
}

export interface SimulateVars {
  title: string;
  amount: number;
  currency?: string;
  domain?: 'personal' | 'business';
  recurring?: boolean;
}

export function useSimulate() {
  return useMutation({
    mutationFn: (vars: SimulateVars) =>
      api
        .post<{ simulation: Simulation }>('/ai/simulate', vars)
        .then((r) => r.simulation),
  });
}

export interface ReceiptScan {
  is_receipt: boolean;
  merchant: string;
  total: number;
  currency: string;
  date?: string;
  type: 'expense' | 'smoking';
  confidence: 'low' | 'medium' | 'high';
}

/** Send a receipt photo (base64) to the backend for a vision extraction. */
export function useScanReceipt() {
  return useMutation({
    mutationFn: (vars: { image: string; mediaType: string }) =>
      api
        .post<{ scan: ReceiptScan }>('/ai/scan-receipt', vars)
        .then((r) => r.scan),
  });
}
