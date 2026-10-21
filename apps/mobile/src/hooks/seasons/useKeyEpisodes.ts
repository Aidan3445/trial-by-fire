import { useQuery, useQueries, type Query } from '@tanstack/react-query';
import { type KeyEpisodes } from '~/types/episodes';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches key episodes data with aggressive refresh only during episode air windows.
 * @param seasonId The ID of the season to fetch episodes for.
 * @returnObj `KeyEpisodes`
 */
export function useKeyEpisodes(seasonId: number | null) {
  const fetchData = useFetch();
  return useQuery<KeyEpisodes>({
    queryKey: ['episodes', seasonId, 'key'],
    queryFn: async () => {
      if (!seasonId) return {} as KeyEpisodes;

      const res = await fetchData(`/api/seasons/episodes/key?seasonId=${seasonId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch episode data');
      }
      const keyEpisodes = (await res.json()) as KeyEpisodes;
      return {
        mergeEpisode: keyEpisodes.mergeEpisode
          ? { ...keyEpisodes.mergeEpisode, airDate: new Date(keyEpisodes.mergeEpisode.airDate) }
          : null,
        nextEpisode: keyEpisodes.nextEpisode
          ? { ...keyEpisodes.nextEpisode, airDate: new Date(keyEpisodes.nextEpisode.airDate) }
          : null,
        previousEpisode: keyEpisodes.previousEpisode
          ? {
            ...keyEpisodes.previousEpisode,
            airDate: new Date(keyEpisodes.previousEpisode.airDate)
          }
          : null
      };
    },
    staleTime: query => {
      return determineEpisodeRefreshConfig(query.state.data).staleTime;
    },
    refetchInterval: query => {
      return determineEpisodeRefreshConfig(query.state.data).refetchInterval as number | false;
    },
    refetchOnWindowFocus: query => {
      return determineEpisodeRefreshConfig(query.state.data).refetchOnWindowFocus;
    },
    refetchOnReconnect: query => {
      return determineEpisodeRefreshConfig(query.state.data).refetchOnReconnect;
    },
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    enabled: !!seasonId
  });
}

export function useKeyEpisodesBySeason(seasonIds: number[]) {
  const fetchData = useFetch();

  const queries = useQueries({
    queries: seasonIds.map(seasonId => ({
      queryKey: ['episodes', seasonId, 'key'],
      enabled: !!seasonId,
      queryFn: async () => {
        const res = await fetchData(
          `/api/seasons/episodes/key?seasonId=${seasonId}`
        );
        if (!res.ok) {
          throw new Error('Failed to fetch episode data');
        }

        const keyEpisodes = (await res.json()) as KeyEpisodes;

        return {
          mergeEpisode: keyEpisodes.mergeEpisode
            ? { ...keyEpisodes.mergeEpisode, airDate: new Date(keyEpisodes.mergeEpisode.airDate) }
            : null,
          nextEpisode: keyEpisodes.nextEpisode
            ? { ...keyEpisodes.nextEpisode, airDate: new Date(keyEpisodes.nextEpisode.airDate) }
            : null,
          previousEpisode: keyEpisodes.previousEpisode
            ? {
              ...keyEpisodes.previousEpisode,
              airDate: new Date(keyEpisodes.previousEpisode.airDate)
            }
            : null
        };
      },
      staleTime: (query: Query<KeyEpisodes>) =>
        determineEpisodeRefreshConfig(query.state.data).staleTime,
      refetchInterval: (query: Query<KeyEpisodes>) =>
        determineEpisodeRefreshConfig(query.state.data).refetchInterval as number | false,
      refetchOnWindowFocus: (query: Query<KeyEpisodes>) =>
        determineEpisodeRefreshConfig(query.state.data).refetchOnWindowFocus,
      refetchOnReconnect: (query: Query<KeyEpisodes>) =>
        determineEpisodeRefreshConfig(query.state.data).refetchOnReconnect,
      gcTime: 24 * 60 * 60 * 1000
    }))
  });

  return seasonIds.reduce<Record<number, KeyEpisodes | undefined>>(
    (acc, seasonId, index) => {
      acc[seasonId] = queries[index]?.data;
      return acc;
    },
    {}
  );
}

/**
 * Determines refresh configuration based on episode timing
 */
function determineEpisodeRefreshConfig(keyEpisodes: KeyEpisodes | undefined) {
  // Outside the air window the cache is persisted and trusted for hours; in dev keep it short so
  // server-side DEV_FAKE_AIRING changes show up after a relaunch instead of hours later
  // eslint-disable-next-line no-undef
  const idleStaleTime = __DEV__ ? 60 * 1000 : 2 * 60 * 60 * 1000;
  const quiet = {
    staleTime: idleStaleTime,
    refetchInterval: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    inTransitionWindow: false
  };
  const transition = {
    staleTime: 5 * 1000, // 5 seconds
    refetchInterval: 10 * 1000, // 10 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    inTransitionWindow: true
  };

  // Once an episode starts it becomes the previous episode, so keep polling until it has aired
  if (keyEpisodes?.previousEpisode?.airStatus === 'Airing') return transition;

  if (!keyEpisodes?.nextEpisode?.airDate || !keyEpisodes.nextEpisode.runtime) return quiet;

  const now = new Date();
  const episodeStart = keyEpisodes.nextEpisode.airDate;
  const episodeEnd = new Date(episodeStart.getTime() + keyEpisodes.nextEpisode.runtime * 60 * 1000);

  // 10 minutes before start to 10 minutes after end
  const windowStart = new Date(episodeStart.getTime() - 10 * 60 * 1000);
  const windowEnd = new Date(episodeEnd.getTime() + 10 * 60 * 1000);

  return now >= windowStart && now <= windowEnd ? transition : quiet;
}
