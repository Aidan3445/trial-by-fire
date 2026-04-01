import { useQuery } from '@tanstack/react-query';
import { type SeasonsDataQuery } from '~/types/seasons';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { useIsEpisodeAiringForSeason } from '~/hooks/helpers/useIsEpisodeAiring';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches seasons data from the API.
 * @param {boolean} includeInactive Whether to include inactive seasons.
 * @param {number} [seasonId] Optional season ID to fetch specific season data, overrides includeInactive
 * @returnObj `SeasonsDataQuery`
 */
export function useSeasonsData(includeInactive: boolean, seasonId?: number) {
  const fetchData = useFetch();
  const isEpisodeAiring = useIsEpisodeAiringForSeason(seasonId ?? null);
  const refreshConfig = useRefreshConfig(isEpisodeAiring, false);

  return useQuery<SeasonsDataQuery[]>({
    queryKey: ['seasons', seasonId, includeInactive],
    queryFn: async () => {
      const res = await fetchData(
        `/api/seasons/seasonsData?includeInactive=${includeInactive}${seasonId ? `&seasonId=${seasonId}` : ''}`
      );
      if (!res.ok) {
        throw new Error('Failed to fetch season data');
      }
      const { seasonsData } = (await res.json()) as { seasonsData: SeasonsDataQuery[] };
      return seasonsData.map(seasonData => ({
        ...seasonData,
        // Convert date strings to Date objects
        season: {
          ...seasonData.season,
          premiereDate: new Date(seasonData.season.premiereDate),
          finaleDate: seasonData.season.finaleDate ? new Date(seasonData.season.finaleDate) : null
        },
        episodes: seasonData.episodes.map(episode => ({
          ...episode,
          airDate: new Date(episode.airDate)
        }))
      }));
    },
    enabled: true,
    ...(isEpisodeAiring
      ? refreshConfig
      : {
        staleTime: 10 * 60 * 1000, // 10 minutes
        gcTime: 24 * 60 * 60 * 1000, // 24 hours
        refetchOnMount: true,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchInterval: false
      })
  });
}
