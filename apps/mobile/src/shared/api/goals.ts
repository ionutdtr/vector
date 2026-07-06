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

export interface GoalUpdate {
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  priority?: number;
}

export function useCreateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GoalInput) => api.post<{ goal: Goal }>('/goals', input),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useUpdateGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { id: string; patch: GoalUpdate }) =>
      api.patch<{ goal: Goal }>(`/goals/${vars.id}`, vars.patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}

export function useDeleteGoal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.del<{ ok: boolean }>(`/goals/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.goals }),
  });
}
