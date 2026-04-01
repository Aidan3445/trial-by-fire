import { useQuery } from '@tanstack/react-query';
import { type Season } from '~/types/seasons';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches seasons data from the API.
 * Optimized for essentially static data that never changes.
 * @param {boolean} includeInactive Whether to include inactive seasons.
 * @returnObj `Season[]`
 */
export function useSeasons(includeInactive: boolean) {
  const fetchData = useFetch();
  return useQuery<Season[]>({
    queryKey: ['seasons', includeInactive],
    queryFn: async () => {
      const res = await fetchData(`/api/seasons/seasons?includeInactive=${includeInactive}`);
      if (!res.ok) {
        throw new Error('Failed to fetch seasons data');
      }
      const { seasons } = (await res.json()) as { seasons: Season[] };
      return seasons;
    },
    staleTime: Infinity,
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchInterval: false,
    enabled: true
  });
}
