import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useKeyEpisodesBySeason } from '~/hooks/seasons/useKeyEpisodes';
import { getAirStatus } from '~/lib/episodes';
import { type LivePredictionWithOptions } from '~/types/events';
import { type Episode } from '~/types/episodes';

export function useLivePredictions() {
  const getData = useFetch();
  const { data: currentSeasons } = useSeasons(false);
  const seasonIds = useMemo(() => currentSeasons?.map((s) => s.seasonId) ?? [],
    [currentSeasons]
  );
  const keyEpisodesByseason = useKeyEpisodesBySeason(seasonIds);

  // Find the currently airing episode across all active seasons
  const airingEpisode = useMemo<Episode | null>(() => {
    for (const seasonId of seasonIds) {
      const prev = keyEpisodesByseason[seasonId]?.previousEpisode;
      if (!prev) continue;
      const status = getAirStatus(prev.airDate, prev.runtime);
      if (status === 'Airing') return prev;
    }
    return null;
  }, [seasonIds, keyEpisodesByseason]);

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
