import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { useLeague } from '~/hooks/leagues/useLeague';
import { useBaseEvents } from '~/hooks/seasons/useBaseEvents';
import { baseEventsVersion } from '~/lib/events';
import { useParams } from 'next/navigation';
import { useIsEpisodeAiring } from '~/hooks/helpers/useIsEpisodeAiring';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { type Predictions } from '~/types/events';

/**
  * Fetches base event predictions for a league with dynamic refresh rates based on episode air status.
  * @param {string} overrideHash Optional hash to override the URL parameter.
  * @returnObj `Prediction[]`
  */
export function useBasePredictions(overrideHash?: string) {
  const params = useParams();
  const hash = overrideHash ?? params.hash as string;

  const isEpisodeAiring = useIsEpisodeAiring(overrideHash);
  const refreshConfig = useRefreshConfig(isEpisodeAiring);

  // Hits are worked out from the season's events, so refetch whenever those change:
  // when an admin scores one, or when polling picks up someone else's
  const { data: league } = useLeague(overrideHash);
  const { data: baseEvents, isPending: eventsPending } = useBaseEvents(league?.seasonId ?? null);
  const eventsVersion = useMemo(() => baseEventsVersion(baseEvents), [baseEvents]);

  return useQuery<Predictions>({
    queryKey: ['basePredictions', hash, eventsVersion],
    queryFn: async () => {
      if (!hash) throw new Error('League hash is required');

      const response = await fetch(`/api/leagues/${hash}/basePredictions`);
      if (!response.ok) {
        throw new Error('Failed to fetch base predictions');
      }
      return response.json() as Promise<Predictions>;
    },
    // Wait for the events so the first load isn't immediately refetched
    enabled: !!hash && !!league && !eventsPending,
    // Keep showing the last results while new ones load
    placeholderData: keepPreviousData,
    ...refreshConfig,
  });
}
