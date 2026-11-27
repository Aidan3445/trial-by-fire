import { useMemo } from 'react';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useCastaways } from '~/hooks/seasons/useCastaways';

/**
  * The season a new league goes in, matching the server: the soonest season
  * whose finale hasn't aired, and for a clone, one after the original's season.
  * @param afterSeasonId For a clone, the original league's season
  * @returnObj `{ season, castReady }` castReady is undefined while loading
  */
export function useTargetSeason(afterSeasonId?: number) {
  const { data: seasons } = useSeasons(true);
  const season = useMemo(() => {
    if (!seasons) return null;
    const now = Date.now();
    const after = seasons.find((s) => s.seasonId === afterSeasonId);
    return seasons
      .filter((s) => !s.finaleDate || new Date(s.finaleDate).getTime() > now)
      .filter((s) => !after || new Date(s.premiereDate) > new Date(after.premiereDate))
      .toSorted((a, b) => new Date(a.premiereDate).getTime() - new Date(b.premiereDate).getTime())[0] ?? null;
  }, [seasons, afterSeasonId]);

  const { data: castaways } = useCastaways(season?.seasonId ?? null);
  return { season, castReady: castaways === undefined ? undefined : castaways.length > 0 };
}
