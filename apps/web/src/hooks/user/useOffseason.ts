import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import { type OffseasonStatus } from '~/types/survey';

/**
  * Where things stand between seasons for the signed in user.
  * @returnObj `OffseasonStatus`
  */
export function useOffseason() {
  const { isSignedIn } = useAuth();
  return useQuery<OffseasonStatus>({
    queryKey: ['offseason'],
    queryFn: async () => {
      const res = await fetch('/api/seasons/offseason', { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to fetch offseason status');
      return res.json() as Promise<OffseasonStatus>;
    },
    enabled: !!isSignedIn,
    staleTime: 60 * 60 * 1000,
  });
}
