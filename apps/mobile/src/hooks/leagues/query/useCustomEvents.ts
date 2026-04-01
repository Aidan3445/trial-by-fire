import { useQuery } from '@tanstack/react-query';
import { type CustomEvents } from '~/types/events';
import { useIsEpisodeAiring } from '~/hooks/helpers/useIsEpisodeAiring';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches custom events and predictions for a league based on the league hash from the URL parameters.
 * @param {string} overrideHash Optional hash to override the URL parameter.
 * @returnObj `CustomEvents`
 */
export function useCustomEvents(overrideHash?: string) {
  const fetchData = useFetch();
  const params = useLocalSearchParams();
  const hash = overrideHash ?? (params.hash as string);

  const isEpisodeAiring = useIsEpisodeAiring(overrideHash);
  const refreshConfig = useRefreshConfig(isEpisodeAiring, true, overrideHash);

  return useQuery<CustomEvents>({
    queryKey: ['customEvents', hash],
    queryFn: async () => {
      if (!hash) throw new Error('League hash is required');

      const response = await fetchData(`/api/leagues/${hash}/customEvents`);
      if (!response.ok) {
        throw new Error('Failed to fetch league');
      }
      return response.json();
    },
    enabled: !!hash,
    ...refreshConfig
  });
}
