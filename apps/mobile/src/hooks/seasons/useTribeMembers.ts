import { useQuery } from '@tanstack/react-query';
import { useIsEpisodeAiringForSeason } from '~/hooks/helpers/useIsEpisodeAiring';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches tribe members data from the API.
 * @param {number} seasonId The season ID to get tribes timeline for.
 * @param {number} episodeNumber The episode number to get tribe members for.
 * @returnObj `Record<tribeId, castawayId[]>`
 */
export function useTribeMembers(seasonId: number | null, episodeNumber: number | null) {
  const fetchData = useFetch();
  const isEpisodeAiring = useIsEpisodeAiringForSeason(seasonId ?? null);
  const refreshConfig = useRefreshConfig(isEpisodeAiring, false);

  return useQuery<Record<number, number[]>>({
    queryKey: ['tribeMembers', seasonId],
    queryFn: async () => {
      if (!seasonId || !episodeNumber) {
        return {};
      }

      const res = await fetchData(
        `/api/seasons/tribeMembers?seasonId=${seasonId}&episodeNumber=${episodeNumber}`
      );
      if (!res.ok) {
        throw new Error('Failed to fetch tribes timeline data');
      }
      return res.json();
    },
    enabled: !!seasonId && !!episodeNumber,
    ...refreshConfig
  });
}
