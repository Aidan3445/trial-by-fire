import { useMemo } from 'react';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useKeyEpisodesBySeason } from '~/hooks/seasons/useKeyEpisodes';
import { getAirStatus } from '~/lib/episodes';
import { type Episode } from '~/types/episodes';

/**
 * The episode airing right now across the current seasons, if any
 * @returnObj `{ airingEpisode: Episode | null, seasonIds: number[] }`
 */
export function useAiringEpisode() {
  const { data: currentSeasons } = useSeasons(false);
  const seasonIds = useMemo(() => currentSeasons?.map((s) => s.seasonId) ?? [],
    [currentSeasons]
  );
  const keyEpisodesBySeason = useKeyEpisodesBySeason(seasonIds);

  const airingEpisode = useMemo<Episode | null>(() => {
    for (const seasonId of seasonIds) {
      const prev = keyEpisodesBySeason[seasonId]?.previousEpisode;
      if (!prev) continue;
      if (getAirStatus(prev.airDate, prev.runtime) === 'Airing') return prev;
    }
    return null;
  }, [seasonIds, keyEpisodesBySeason]);

  return { airingEpisode, seasonIds };
}
