import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './client';
import { queryKeys } from './keys';

export interface ImportSummary {
  imported: number;
  duplicates: number;
  skipped: Record<string, number>;
  byType: Record<string, number>;
  reconciled: Partial<Record<'current' | 'savings', number>>;
}

export function useImportRevolut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (csv: string) => api.post<ImportSummary>('/import/revolut', { csv }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.events });
      qc.invalidateQueries({ queryKey: queryKeys.networth });
      qc.invalidateQueries({ queryKey: queryKeys.accounts });
      qc.invalidateQueries({ queryKey: queryKeys.insights });
      qc.invalidateQueries({ queryKey: queryKeys.discipline });
      qc.invalidateQueries({ queryKey: queryKeys.briefing });
    },
  });
}
