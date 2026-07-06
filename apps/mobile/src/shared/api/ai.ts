import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';

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
      api.post<{ threadId: string; reply: string }>('/ai/chat', {
        message: vars.message,
        threadId: vars.threadId ?? undefined,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ai', 'chat'] }),
  });
}
