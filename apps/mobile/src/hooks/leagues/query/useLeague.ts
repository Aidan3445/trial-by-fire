import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type League } from '~/types/leagues';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useIsFocused } from '@react-navigation/native';

/**
 * Fetches league data based on the league hash from the URL parameters.
 * Adjusts stale time and fetch intervals based on the league status and episode airing status.
 * @param overrideHash Optional hash to override URL parameter.
 * @param rapidRefresh Faster refresh during airing episode
 * @returnObj `League`
 */
export function useLeague(overrideHash?: string, rapidRefresh = false) {
  const isFocused = useIsFocused();
  const router = useRouter();
  const fetchData = useFetch();
  const params = useLocalSearchParams();
  const hash = overrideHash ?? (params.hash as string);

  return useQuery<League>({
    queryKey: ['league', hash],
    queryFn: async () => {
      if (!hash) throw new Error('League hash is required');

      const response = await fetchData(`/api/leagues/${hash}`);
      if (!response.ok) {
        if (response.status === 403) {
          router.replace('/leagues');
          return Promise.reject(new Error('Access to this league is forbidden'));
        }

        throw new Error('Failed to fetch league');
      }
      return response.json();
    },
    enabled: !!hash && isFocused,
    staleTime: query => {
      const data = query.state.data;
      if (!data) return 0;

      switch (data.status) {
        case 'Predraft':
          return 30 * 1000; // 30 seconds
        case 'Draft':
          return 10 * 1000; // 10 seconds
        case 'Active':
          return 5 * 60 * 1000; // 5 minutes
        case 'Inactive':
          return 60 * 60 * 1000; // 1 hour
        default:
          return 60 * 2000; // 2 minute fallback
      }
    },
    gcTime: 10 * 60 * 1000,
    refetchInterval: query => {
      if (rapidRefresh) return 10 * 1000; // 10 seconds if rapid refresh is enabled

      const data = query.state.data;
      if (!data) return false;

      switch (data.status) {
        case 'Draft':
          return 5 * 1000; // 5 seconds during draft
        case 'Predraft':
          return 60 * 1000; // 1 minute during predraft (waiting for draft to start)
        case 'Inactive':
          return false; // never refetch inactive leagues
        default:
          return 5 * 60 * 1000; // 5 minutes for active and other leagues
      }
    },
    refetchOnWindowFocus: query => {
      const data = query.state.data;
      return data?.status === 'Draft' || data?.status === 'Predraft';
    },
    refetchOnReconnect: query => {
      const data = query.state.data;
      return data?.status === 'Draft' || data?.status === 'Predraft';
    }
  });
}
