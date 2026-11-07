import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { type DevHarnessResponse } from '~/app/api/sys/dev-override/route';
import { type EpisodeOverrideConfig } from '~/types/episodes';

/*
 * Dev harness client. Only imported by dev-only code (the sys sidebar, the root layout
 * listener behind a NODE_ENV check, and useDevOverrideActive), so none of it ships to prod.
 */

export const DEV_HARNESS_KEY = ['devHarness'] as const;
const ENDPOINT = '/api/sys/dev-override';
const POLL_INTERVAL_MS = 2000;

/** Polls the dev server's harness state */
export function useDevHarness() {
  return useQuery<DevHarnessResponse>({
    queryKey: DEV_HARNESS_KEY,
    queryFn: async () => {
      const res = await fetch(ENDPOINT, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch dev harness state');
      return res.json() as Promise<DevHarnessResponse>;
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: 0,
  });
}

export type DevHarnessUpdate = { config?: EpisodeOverrideConfig | null; broadcast?: boolean };

/** Writes to the dev server's harness state */
export function useUpdateDevHarness() {
  const queryClient = useQueryClient();
  return useCallback(async (update: DevHarnessUpdate) => {
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(update),
    });
    if (!res.ok) throw new Error('Failed to update dev harness');
    const state = await res.json() as DevHarnessResponse;
    // The listener sees the new version and resets the rest of the cache
    queryClient.setQueryData(DEV_HARNESS_KEY, state);
    return state;
  }, [queryClient]);
}
