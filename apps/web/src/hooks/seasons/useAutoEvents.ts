import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { type AutoEvent } from '~/types/events';
import { useIsEpisodeAiringForSeason } from '~/hooks/helpers/useIsEpisodeAiring';

type AutoEventAction = 'view' | 'deny' | 'restore';

/**
  * Fetches the auto events detected for a season. System admins only.
  * Polls while an episode airs; the server answers from cache until an auto event changes.
  * @param {number} seasonId The season ID to get auto events for.
  * @param {boolean} enabled Whether the viewer can see auto events.
  * @returnObj `AutoEvent[]`
  */
export function useAutoEvents(seasonId: number | null, enabled = true) {
  const isEpisodeAiring = useIsEpisodeAiringForSeason(seasonId);

  return useQuery<AutoEvent[]>({
    queryKey: ['autoEvents', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];

      const res = await fetch(`/api/seasons/autoEvents?seasonId=${seasonId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch auto events');
      }
      const autoEvents = await res.json() as AutoEvent[];
      return autoEvents.map((autoEvent) => ({ ...autoEvent, createdAt: new Date(autoEvent.createdAt) }));
    },
    enabled: !!seasonId && enabled,
    staleTime: isEpisodeAiring ? 5 * 1000 : 60 * 1000,
    refetchInterval: isEpisodeAiring ? 10 * 1000 : 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  });
}

/**
  * Mark auto events viewed, deny them, or restore denied ones.
  * @param {number} seasonId The season the auto events belong to.
  */
export function useUpdateAutoEvents(seasonId: number | null) {
  const queryClient = useQueryClient();
  const queryKey = ['autoEvents', seasonId];

  return useMutation({
    mutationFn: async ({ autoEventIds, action }: { autoEventIds: number[]; action: AutoEventAction }) => {
      const res = await fetch('/api/seasons/autoEvents', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seasonId, autoEventIds, action }),
      });
      if (!res.ok) throw new Error('Failed to update auto events');
      return res.json() as Promise<{ changed: number }>;
    },
    // Update the list right away; the refetch after settles it
    onMutate: async ({ autoEventIds, action }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<AutoEvent[]>(queryKey);
      queryClient.setQueryData<AutoEvent[]>(queryKey, (autoEvents) => autoEvents?.map((autoEvent) => {
        if (!autoEventIds.includes(autoEvent.autoEventId)) return autoEvent;
        if (action === 'view') return { ...autoEvent, viewed: true };
        if (action === 'deny') return { ...autoEvent, status: 'denied', viewed: true };
        return { ...autoEvent, status: 'pending' };
      }));
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  });
}
