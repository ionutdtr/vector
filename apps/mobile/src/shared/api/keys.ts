export const queryKeys = {
  networth: ['networth'] as const,
  events: ['events'] as const,
  event: (id: string) => ['events', id] as const,
  accounts: ['accounts'] as const,
  insights: ['insights'] as const,
  ips: ['ips'] as const,
  goals: ['goals'] as const,
  discipline: ['discipline'] as const,
  briefing: ['briefing'] as const,
  recurring: ['recurring'] as const,
};
