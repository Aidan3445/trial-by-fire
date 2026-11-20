import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/expo';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type OffseasonStatus } from '~/types/survey';

/**
 * Where things stand between seasons for the signed in user: the season that
 * just ended, the next one, and whether to show the season over notice.
 * @returnObj `OffseasonStatus`
 */
export function useOffseason() {
  const getData = useFetch();
  const { isSignedIn } = useAuth();
  return useQuery<OffseasonStatus>({
    queryKey: ['offseason'],
    queryFn: async () => {
      const res = await getData('/api/seasons/offseason');
      if (!res.ok) throw new Error('Failed to fetch season status');
      return res.json();
    },
    enabled: !!isSignedIn,
    // Changes with the season calendar, so check fresh each launch
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
  });
}
