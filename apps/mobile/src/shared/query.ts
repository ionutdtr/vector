import { QueryClient } from '@tanstack/react-query';

/**
 * A single app-wide QueryClient, exported so the auth flow can clear it on
 * sign-in / sign-out. Query keys are not user-scoped, so without clearing it one
 * user's cached financial data could momentarily flash to the next user who
 * signs in on the same device.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1, refetchOnWindowFocus: false },
  },
});
