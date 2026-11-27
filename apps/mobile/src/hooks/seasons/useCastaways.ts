import { useQuery } from '@tanstack/react-query';
import { type Castaway } from '~/types/castaways';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
 * Fetches castaways data from the API.
 * Optimized for static data that rarely changes in the database.
 * @param {number} seasonId The season ID to get castaways for.
 * @param {boolean} refetchIfEmpty Refetch on mount while the cached cast is empty,
 * for checks that wait on a cast being announced.
 * @returnObj `Castaway[]`
 */
export function useCastaways(seasonId: number | null, refetchIfEmpty = false) {
  const fetchData = useFetch();
  return useQuery<Castaway[]>({
    queryKey: ['castaways', seasonId],
    queryFn: async () => {
      if (!seasonId) return [];

      const res = await fetchData(`/api/seasons/castaways?seasonId=${seasonId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch castaways data');
      }
      const { castaways } = (await res.json()) as { castaways: Castaway[] };
      return castaways;
    },
    // An empty cast may just not be announced yet, so don't trust it forever when asked not to
    staleTime: refetchIfEmpty ? (query) => (query.state.data?.length ? Infinity : 0) : Infinity,
    gcTime: 7 * 24 * 60 * 60 * 1000, // 7 days
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    refetchOnMount: refetchIfEmpty,
    enabled: !!seasonId
  });
}
