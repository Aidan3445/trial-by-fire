import { useMemo } from 'react';
import { defaultBasePredictionRules } from '~/lib/leagues';
import { scoringEventName } from '~/lib/events';
import { type EnrichedCastaway } from '~/types/castaways';
import { type EnrichedPrediction, type EnrichedEvent, type Prediction, type ScoringBaseEventName } from '~/types/events';
import { type LeagueMember } from '~/types/leagueMembers';
import { type LeagueRules } from '~/types/leagues';
import { type SeasonsDataQuery } from '~/types/seasons';

/**
  * Custom hook to get enriched data for a list of predictions.
  * Combines predictions with their respective rules and references.
  * @param {SeasonsDataQuery} seasonData The season data containing tribes, castaways, eliminations, and tribes timeline.
  * @param {LeagueData} leagueData Optional league data containing members, and rules.
  * @param {EnrichedEvent[]} events The list of to use for enriching predictions.
  * @param {Prediction[]} predictions The list of predictions to enrich.
  */
export function useEnrichPredictions(
  seasonData: SeasonsDataQuery,
  events: EnrichedEvent[] | null,
  predictions: Prediction[] | null,
  leagueData?: {
    leagueMembers?: {
      loggedIn?: LeagueMember;
      members: LeagueMember[];
    },
    leagueRules?: LeagueRules
  },
) {
  const {
    tribes,
    castaways,
    eliminations,
    tribesTimeline
  } = seasonData;

  const {
    leagueRules: rules,
    leagueMembers
  } = leagueData ?? {};


  const lookupMaps = useMemo(() => {
    if (!leagueData || !tribes || !castaways || !events || !eliminations) {
      return null;
    }

    const tribesById = new Map(tribes.map(tribe => [tribe.tribeId, tribe]));
    const castawaysById = new Map(castaways.map(castaway => [castaway.castawayId, castaway]));
    const membersById = new Map((leagueMembers ?? { members: [] }).members.map(member => [member.memberId, member]));
    const eventsById = new Map(events.map(event => [event.eventId, event]));

    const eliminationEpisodes = new Map<number, number>();
    eliminations.forEach((episodeElims, index) => {
      episodeElims.forEach(elim => {
        if (elim?.castawayId) {
          eliminationEpisodes.set(elim.castawayId, index + 1);
        }
      });
    });
    const redemptionsByCastaway = new Map(castaways.map(c => [c.castawayId, c.redemption]));

    return {
      tribesById,
      castawaysById,
      membersById,
      eventsById,
      eliminationEpisodes,
      redemptionsByCastaway
    };
  }, [leagueData, tribes, castaways, events, eliminations, leagueMembers]);

  const findTribe = useMemo(() => {
    if (!tribesTimeline || !lookupMaps) return null;

    return (castawayId: number, episodeNumber: number) => {
      const sortedTimeline = Object.entries(tribesTimeline)
        .filter(([epNumStr]) => parseInt(epNumStr) <= episodeNumber)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));

      for (const [, tribesInEpisode] of sortedTimeline) {
        for (const [tribeIdStr, tribeMembers] of Object.entries(tribesInEpisode)) {
          if (tribeMembers.includes(castawayId)) {
            const tribe = lookupMaps.tribesById.get(parseInt(tribeIdStr));
            return tribe ? {
              name: tribe.tribeName,
              color: tribe.tribeColor
            } : null;
          }
        }
      }
      return null;
    };
  }, [tribesTimeline, lookupMaps]);

  const enrichedPredictions = useMemo(() => {
    if (!predictions || !lookupMaps || !findTribe || !rules) {
      return [];
    }

    const predictionGroups: Record<string, { prediction: EnrichedPrediction; eventIds: Set<number> }> = {};

    // combine the references of every event with the same name into one prediction row
    const mergeEvent = (existing: { prediction: EnrichedPrediction; eventIds: Set<number> }, event: EnrichedEvent) => {
      if (event.eventId === null || existing.eventIds.has(event.eventId)) return;
      existing.eventIds.add(event.eventId);
      const target = existing.prediction.event;
      target.referenceMap = [
        ...target.referenceMap,
        ...event.referenceMap.filter(newRef =>
          !target.referenceMap.some(existingRef =>
            JSON.stringify(existingRef) === JSON.stringify(newRef)))
      ];
      target.references = [
        ...target.references,
        ...event.references.filter(newRef =>
          !target.references.some(existingRef =>
            existingRef.id === newRef.id &&
            existingRef.type === newRef.type))
      ];
        existing.prediction.event.eventId = null;
      if (!target.label?.includes(event.label ?? '') && event.label) {
        target.label = target.label
          ? `${target.label}#/& ${event.label}`
          : event.label;
      }
    };

    for (const prediction of predictions) {
      if (!prediction.eventId || prediction.hit === null) {
        continue;
      }

      const eventRef = prediction.eventId ? lookupMaps.eventsById.get(prediction.eventId) : null;
      if (!eventRef) continue;
      const event = { ...eventRef };

      let existingGroup = predictionGroups[prediction.eventName];
      if (!existingGroup) {
        let points: number | null = null;
        if (event.eventSource === 'Base') {
          const basePredictionRules = rules.basePrediction ?? defaultBasePredictionRules;
          points = basePredictionRules[prediction.eventName as ScoringBaseEventName]?.points ?? null;
        } else {
          points = rules.custom?.find(r => r.eventName === event.eventName)?.points ?? null;
        }

        if (points === null) continue;

        existingGroup = {
          prediction: { event, points, hits: [], misses: [] },
          eventIds: new Set(event.eventId !== null ? [event.eventId] : [])
        };
        predictionGroups[prediction.eventName] = existingGroup;

        // pull in sibling results nobody predicted, so every result shows
        for (const sibling of events ?? []) {
          if (sibling.episodeNumber !== event.episodeNumber || sibling.eventSource !== event.eventSource) continue;
          const siblingName = sibling.eventSource === 'Base'
            ? scoringEventName(sibling.eventName)
            : sibling.eventName;
          if (siblingName !== prediction.eventName) continue;
          mergeEvent(existingGroup, sibling);
        }
      } else {
        mergeEvent(existingGroup, event);
      }
      const existingPrediction = existingGroup.prediction;

      const member = lookupMaps.membersById.get(prediction.predictionMakerId);
      if (!member) continue;

      const entry = {
        member,
        hit: prediction.hit,
        bet: prediction.bet,
        reference: {
          type: prediction.referenceType,
          id: prediction.referenceId,
          name: '',
          shortName: '',
          color: ''
        }
      };

      if (prediction.referenceType === 'Castaway') {
        const castaway = lookupMaps.castawaysById.get(prediction.referenceId);
        if (!castaway) continue;

        const tribe = findTribe(castaway.castawayId, existingPrediction.event.episodeNumber);
        if (!tribe) continue;

        const eliminatedEpisode = lookupMaps.eliminationEpisodes.get(castaway.castawayId) ?? null;
        const redemptionHistory = lookupMaps.redemptionsByCastaway.get(castaway.castawayId);

        const castawayWithTribe: EnrichedCastaway = {
          ...castaway,
          tribe,
          eliminatedEpisode,
          redemption: redemptionHistory
        };

        entry.reference = {
          ...entry.reference,
          name: castaway.fullName,
          shortName: castaway.shortName,
          color: castawayWithTribe.tribe?.color ?? '#AAAAAA'
        };

      } else if (prediction.referenceType === 'Tribe') {
        const tribe = lookupMaps.tribesById.get(prediction.referenceId);
        if (!tribe) continue;

        entry.reference = {
          ...entry.reference,
          name: tribe.tribeName,
          shortName: tribe.tribeName,
          color: tribe.tribeColor
        };
      }

      if (prediction.hit) {
        existingPrediction.hits.push(entry);
      } else {
        existingPrediction.misses.push(entry);
      }
    }

    return Object.values(predictionGroups).map(group => group.prediction);
  }, [predictions, lookupMaps, findTribe, rules, events]);

  return enrichedPredictions;
}


