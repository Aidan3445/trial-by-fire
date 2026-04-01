import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useIsEpisodeAiring } from '~/hooks/helpers/useIsEpisodeAiring';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { type Predictions } from '~/types/events';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches base event predictions for a league with dynamic refresh rates based on episode air status.
 * @param {string} overrideHash Optional hash to override the URL parameter.
 * @returnObj `Prediction[]`
 */
export function useBasePredictions(overrideHash?: string) {
  const fetchData = useFetch();
  const params = useLocalSearchParams();
  const hash = overrideHash ?? params.hash;

  const isEpisodeAiring = useIsEpisodeAiring(overrideHash);
  const refreshConfig = useRefreshConfig(isEpisodeAiring, true, overrideHash);

  return useQuery<Predictions>({
    queryKey: ['basePredictions', hash],
    queryFn: async () => {
      if (!hash) throw new Error('League hash is required');

      const response = await fetchData(`/api/leagues/${hash}/basePredictions`);
      if (!response.ok) {
        throw new Error('Failed to fetch base predictions');
      }
      return response.json();
    },
    enabled: !!hash,
    ...refreshConfig
  });
}
