import { useQuery } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useAiringEpisode } from '~/hooks/seasons/useAiringEpisode';
import { type LivePredictionWithOptions } from '~/types/events';

export function useLivePredictions() {
  const getData = useFetch();
  const { airingEpisode, seasonIds } = useAiringEpisode();

  const episodeId = airingEpisode?.episodeId;

  const query = useQuery<LivePredictionWithOptions[]>({
    queryKey: ['livePredictions', episodeId],
    queryFn: async () => {
      if (!episodeId) return [];
      const res = await getData(`/api/live?episodeId=${episodeId}`);
      if (!res.ok) throw new Error('Failed to fetch live predictions');
      return res.json();
    },
    enabled: !!episodeId,
    refetchInterval: 10_000,
  });

  return {
    ...query,
    airingEpisode,
    seasonId: airingEpisode?.seasonId ?? seasonIds[0] ?? null,
  };
}
