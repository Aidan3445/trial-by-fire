import { useQuery } from '@tanstack/react-query';
import { type LeagueDetails } from '~/types/leagues';
import { useFetch } from '~/hooks/helpers/useFetch';

/** 
  * Fetch function for suspense queries.
  * @returns A promise resolving to the leagues data.
  */
async function fetchLeagues(fetchData: ReturnType<typeof useFetch>) {
  const response = await fetchData('/api/leagues');
  if (!response.ok) {
    return [];
  }
  const { leagues } = await response.json() as { leagues: LeagueDetails[]; };
  return leagues;
};

/**
 * Fetches the leagues for the current user.
 */
export function useLeagues() {
  const fetchData = useFetch('GET');
  return useQuery<LeagueDetails[]>({
    queryKey: ['leagues'],
    queryFn: fetchLeagues.bind(null, fetchData),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 24 * 60 * 60 * 1000, // 24 hours
    refetchOnReconnect: true,
    refetchOnMount: true,
    refetchInterval: false,
    enabled: true
  });
}
