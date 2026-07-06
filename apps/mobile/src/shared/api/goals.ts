import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface Goal {
  id: string;
  kind: string;
  name: string;
  targetAmount: string | null;
  currentAmount: string;
  currency: string;
  targetDate: string | null;
  priority: number;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
}

export interface GoalInput {
  kind: string;
  name: string;
  targetAmount?: number;
  currency?: string;
  targetDate?: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export function useGoals() {
  return useQuery({
    queryKey: queryKeys.goals,
    queryFn: () => api.get<{ goals: Goal[] }>('/goals').then((r) => r.goals),
  });
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => api.post<{ goal: Goal }>('/goals', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}
