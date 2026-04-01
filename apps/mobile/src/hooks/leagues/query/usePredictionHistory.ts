import { useEffect, useMemo, useState } from 'react';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { useKeyEpisodes } from '~/hooks/seasons/useKeyEpisodes';
import { usePredictionsMade } from '~/hooks/leagues/enrich/usePredictionsMade';
import { useCustomEvents } from '~/hooks/leagues/query/useCustomEvents';
import { useBaseEvents } from '~/hooks/seasons/useBaseEvents';
import { type ScoringBaseEventName, type PredictionWithEvent } from '~/types/events';

export function usePredictionHistory() {
  const { data: league } = useLeague();
  const { data: keyEpisodes } = useKeyEpisodes(league?.seasonId ?? null);
  const { data: rules } = useLeagueRules();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: customEvents } = useCustomEvents();
  const { data: baseEvents } = useBaseEvents(league?.seasonId ?? null);

  const [selectedMemberId, setSelectedMemberId] = useState<number | undefined>(
    leagueMembers?.loggedIn?.memberId
  );

  const { basePredictionsMade, customPredictionsMade } = usePredictionsMade(
    undefined,
    selectedMemberId
  );

  // Sync selected member when logged in member loads
  useEffect(() => {
    if (leagueMembers?.loggedIn?.memberId) {
      setSelectedMemberId(leagueMembers.loggedIn.memberId);
    }
  }, [leagueMembers?.loggedIn?.memberId]);

  const predictionsWithEvents = useMemo(() => {
    const predictions: Record<number, PredictionWithEvent[]> = {};
    if (!keyEpisodes?.previousEpisode) return predictions;

    if (baseEvents) {
      Object.entries(basePredictionsMade).forEach(([episodeNumber, predictionMap]) => {
        const episodeNum = Number(episodeNumber);
        if (episodeNum > keyEpisodes.previousEpisode!.episodeNumber) return;

        const predsWithEvents = predictionMap.map((pred) => {
          const rule = rules?.basePrediction?.[pred.eventName as ScoringBaseEventName];
          return {
            ...pred,
            points: rule?.points ?? 0,
            event: Object.values(baseEvents ?? {})
              .map((epEvents) =>
                Object.values(epEvents).find((event) => event.eventId === pred.eventId)
              )
              .find((e) => e !== undefined),
            timing: rule?.timing ?? [],
          };
        });
        if (predsWithEvents.length === 0) return;
        predictions[episodeNum] ??= [];
        predictions[episodeNum].push(...predsWithEvents);
      });
    }

    if (!customEvents?.events) return predictions;

    Object.entries(customPredictionsMade).forEach(([episodeNumber, preds]) => {
      const episodeNum = Number(episodeNumber);
      if (episodeNum > keyEpisodes.previousEpisode!.episodeNumber) return;

      const predsWithEvents = preds.map((pred) => {
        const rule = rules?.custom.find((rule) => rule.eventName === pred.eventName);
        return {
          ...pred,
          points: rule?.points ?? 0,
          event: Object.values(customEvents.events ?? {})
            .map((epEvents) =>
              Object.values(epEvents).find((event) => event.eventId === pred.eventId)
            )
            .find((e) => e !== undefined),
          timing: rule?.timing ?? [],
        };
      });
      if (predsWithEvents.length === 0) return;
      predictions[episodeNum] ??= [];
      predictions[episodeNum].push(...predsWithEvents);
    });

    return predictions;
  }, [
    keyEpisodes?.previousEpisode,
    baseEvents,
    customEvents,
    customPredictionsMade,
    basePredictionsMade,
    rules?.basePrediction,
    rules?.custom,
  ]);

  const stats = useMemo(() => {
    return Object.values(predictionsWithEvents).reduce(
      (acc, pred) => {
        pred.forEach((p) => {
          acc.count.episodes.add(p.predictionEpisodeNumber);
          if (p.eventId === null) return;
          if (p.hit) {
            acc.count.correct++;
            acc.points.earned += p.points;
            acc.points.earnedBets += p.bet ?? 0;
          }
          acc.count.total++;
          acc.points.possible += p.points;
          acc.points.possibleBets += p.bet ?? 0;
        });
        return acc;
      },
      {
        count: {
          correct: 0,
          total: 0,
          episodes: new Set<number>(),
        },
        points: {
          earned: 0,
          possible: 0,
          earnedBets: 0,
          possibleBets: 0,
        },
      }
    );
  }, [predictionsWithEvents]);

  // Format data for carousel (reversed so newest first)
  const carouselData = useMemo(() => {
    return Object.entries(predictionsWithEvents)
      .toReversed()
      .map(([episode, predictions]) => ({
        episode: Number(episode),
        predictions,
      }));
  }, [predictionsWithEvents]);

  // Member options for selector
  const memberOptions = useMemo(() => {
    if (!leagueMembers?.members) return [];

    return [...leagueMembers.members]
      .sort((a, b) => {
        if (a.memberId === leagueMembers.loggedIn?.memberId) return -1;
        if (b.memberId === leagueMembers.loggedIn?.memberId) return 1;
        return a.displayName.localeCompare(b.displayName);
      })
      .map((member) => ({
        value: member.memberId,
        label: member.displayName,
        color: member.color,
      }));
  }, [leagueMembers]);

  return {
    // Data
    league,
    predictionsWithEvents,
    carouselData,
    stats,
    memberOptions,
    keyEpisodes,

    // Member selection
    selectedMemberId,
    setSelectedMemberId,

    // State checks
    hasData: stats.count.total > 0,
    isSingleEpisode: stats.count.episodes.size === 1,
  };
}
