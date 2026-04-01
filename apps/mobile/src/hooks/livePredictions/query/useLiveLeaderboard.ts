import { useQuery } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeaderboardEntry } from '~/types/events';

export function useLiveLeaderboard(seasonId: number | null, type: 'global' | 'friends' = 'global') {
  const getData = useFetch();
  const endpoint = type === 'friends' ? '/api/live/friends' : '/api/live/leaderboard';

  return useQuery<LeaderboardEntry[]>({
    queryKey: ['liveLeaderboard', seasonId, type],
    queryFn: async () => {
      if (!seasonId) return [];
      const res = await getData(`${endpoint}?seasonId=${seasonId}`);
      if (!res.ok) throw new Error('Failed to fetch leaderboard');
      return res.json();
    },
    enabled: !!seasonId,
    refetchInterval: 30_000,
  });
}
