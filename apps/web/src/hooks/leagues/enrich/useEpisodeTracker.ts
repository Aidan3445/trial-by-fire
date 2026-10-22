import { useMemo } from 'react';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import { trackEpisode } from '~/lib/scores';
import { getTribeTimeline } from '~/lib/utils';

/**
  * How the logged in member is doing in the episode that's airing: their pick,
  * secondary pick and predictions. Null when no episode is airing.
  * @param {string} overrideHash Optional hash to override the URL parameter.
  */
export function useEpisodeTracker(overrideHash?: string) {
  const {
    leagueMembers,
    keyEpisodes,
    baseEvents,
    customEvents,
    basePredictions,
    eliminations,
    tribesTimeline,
    selectionTimeline,
    leagueRules,
    leagueSettings,
    streaks,
    castaways,
    tribes,
  } = useLeagueData(overrideHash);

  const tracker = useMemo(() => {
    const memberId = leagueMembers?.loggedIn?.memberId;
    const episode = keyEpisodes?.previousEpisode;
    if (!memberId || episode?.airStatus !== 'Airing' || !keyEpisodes) return null;
    if (!baseEvents || !eliminations || !tribesTimeline || !selectionTimeline) return null;

    const episodeTracker = trackEpisode({
      memberId,
      episodeNumber: episode.episodeNumber,
      baseEvents,
      customEvents,
      basePredictions,
      eliminations,
      tribesTimeline,
      keyEpisodes,
      selectionTimelines: selectionTimeline,
      rules: leagueRules ?? null,
    });
    const streak = streaks?.[memberId]?.[episode.episodeNumber] ?? 0;
    const survivalBonus = Math.min(streak, leagueSettings?.survivalCap ?? 0);
    return {
      ...episodeTracker,
      episode,
      survivalBonus,
      total: episodeTracker.points + survivalBonus,
    };
  }, [
    leagueMembers?.loggedIn?.memberId, keyEpisodes, baseEvents, customEvents, basePredictions,
    eliminations, tribesTimeline, selectionTimeline, leagueRules, leagueSettings?.survivalCap, streaks,
  ]);

  // Season castaways carry their starting tribe; show the one they're on this episode
  const currentCastaways = useMemo(() => {
    const episodeNumber = keyEpisodes?.previousEpisode?.episodeNumber;
    if (!castaways || !tribesTimeline || !tribes || !episodeNumber) return castaways;
    return castaways.map((castaway) => {
      const tribe = getTribeTimeline(castaway.castawayId, tribesTimeline, tribes)
        .findLast((entry) => entry.episode <= episodeNumber)?.tribe;
      return tribe ? { ...castaway, tribe: { name: tribe.tribeName, color: tribe.tribeColor } } : castaway;
    });
  }, [castaways, tribesTimeline, tribes, keyEpisodes?.previousEpisode?.episodeNumber]);

  return { tracker, castaways: currentCastaways, tribes };
}
