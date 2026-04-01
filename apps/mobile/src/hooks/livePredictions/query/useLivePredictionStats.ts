import { useQuery } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LivePredictionUserStats } from '~/types/events';

export function useLivePredictionStats(seasonId: number | null) {
  const getData = useFetch();

  return useQuery<LivePredictionUserStats>({
    queryKey: ['livePredictionStats', seasonId],
    queryFn: async () => {
      const url = seasonId
        ? `/api/live/stats?seasonId=${seasonId}`
        : '/api/live/stats';
      const res = await getData(url);
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
    enabled: !!seasonId,
  });
}
