import { useQuery } from '@tanstack/react-query';
import { type PublicLeague } from '~/types/leagues';
import { useFetch } from '~/hooks/helpers/useFetch';

/**
  * Fetches the leagues for the current user.
  */
export function usePendingLeagues() {
  const fetchData = useFetch('GET');

  return useQuery<PublicLeague[]>({
    queryKey: ['pendingLeagues'],
    queryFn: async () => {
      const response = await fetchData('/api/leagues/pending');
      if (!response.ok) {
        throw new Error('Failed to fetch league');
      }
      const { leagues } = await response.json() as { leagues: PublicLeague[] };
      return leagues;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnReconnect: true,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    enabled: true
  });
}
