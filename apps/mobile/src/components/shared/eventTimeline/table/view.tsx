import { Fragment, useMemo } from 'react';
import { View, Text } from 'react-native';
import EpisodeEventsTableBody from '~/components/shared/eventTimeline/table/body';
import { cn, findTribeCastaways } from '~/lib/utils';
import { type Prediction, type EventWithReferences } from '~/types/events';
import { type SeasonsDataQuery } from '~/types/seasons';
import type { LeagueData } from '~/components/shared/eventTimeline/filters';
import EpisodeScrollContainer from '~/components/shared/eventTimeline/table/scrollContainer';
import StreakRow from '~/components/shared/eventTimeline/table/row/streakRow';
import { type StreakMember } from '~/types/leagueMembers';

export interface EpisodeEventsProps {
  episodeNumber: number;
  seasonData: SeasonsDataQuery;
  leagueData?: LeagueData;
  mockEvents?: EventWithReferences[];
  edit?: boolean;
  filters: {
    castaway: number[];
    tribe: number[];
    member: number[];
    event: string[];
  };
  className?: string;
}

export type EventWithReferencesAndPredOnly = EventWithReferences & {
  predOnly?: boolean;
};

export type PredictionAndPredOnly = Prediction & {
  predOnly?: boolean;
};

export default function EpisodeEvents({
  episodeNumber,
  seasonData,
  leagueData,
  mockEvents,
  edit,
  filters,
  className,
}: EpisodeEventsProps) {
  const { league, selectionTimeline, customEvents, basePredictions } = leagueData ?? {};

  const { baseEvents, episodes, tribesTimeline, eliminations } = useMemo(
    () => seasonData,
    [seasonData]
  );

  const allEvents = useMemo(() => {
    const events: Record<number, EventWithReferences[]> = {};
    (episodes ?? []).forEach((episode) => {
      events[episode.episodeNumber] = [
        ...(baseEvents?.[episode.episodeNumber]
          ? Object.values(baseEvents[episode.episodeNumber]!)
          : []),
        ...(customEvents?.events?.[episode.episodeNumber]
          ? Object.values(customEvents.events[episode.episodeNumber] ?? {})
          : []),
      ];
    });
    return events;
  }, [baseEvents, customEvents, episodes]);

  const combinedEvents = useMemo(() => {
    if (episodeNumber === -1) return allEvents;
    return { [episodeNumber]: allEvents[episodeNumber] ?? [] };
  }, [allEvents, episodeNumber]);

  const { combinedPredictions, enrichmentOnlyEvents } = useMemo(() => {
    const predictions: Record<number, Prediction[]> = {};
    const enrichmentEvents: EventWithReferences[] = [];

    if (episodeNumber === -1) {
      (episodes ?? []).forEach((episode) => {
        predictions[episode.episodeNumber] = [
          ...(basePredictions?.[episode.episodeNumber]
            ? Object.values(basePredictions[episode.episodeNumber] ?? {}).flat()
            : []),
          ...(customEvents?.predictions?.[episode.episodeNumber]
            ? Object.values(customEvents.predictions[episode.episodeNumber] ?? {}).flat()
            : []),
        ].filter((prediction) => {
          const eventEpNum = prediction.eventEpisodeNumber;
          if (!eventEpNum) return false;
          const matchingEvent = allEvents[eventEpNum]?.find(
            (e) => e.eventName === prediction.eventName
          );
          if (matchingEvent) {
            if (eventEpNum !== episode.episodeNumber) {
              if (!enrichmentEvents.some((e) => e.eventId === matchingEvent.eventId))
                enrichmentEvents.push(matchingEvent);
            }
            return true;
          }
          return false;
        });
      });
    } else {
      predictions[episodeNumber] = [
        ...(basePredictions?.[episodeNumber]
          ? Object.values(basePredictions[episodeNumber]).flat()
          : []),
        ...(customEvents?.predictions?.[episodeNumber]
          ? Object.values(customEvents.predictions[episodeNumber]).flat()
          : []),
      ].filter((prediction) => {
        const eventEpNum = prediction.eventEpisodeNumber;
        if (!eventEpNum) return false;
        const matchingEvent = allEvents[eventEpNum]?.find(
          (e) => e.eventName === prediction.eventName
        );
        if (matchingEvent) {
          if (eventEpNum !== episodeNumber) {
            if (!enrichmentEvents.some((e) => e.eventId === matchingEvent.eventId))
              enrichmentEvents.push(matchingEvent);
          }
          return true;
        }
        return false;
      });
    }
    return { combinedPredictions: predictions, enrichmentOnlyEvents: enrichmentEvents };
  }, [basePredictions, customEvents, allEvents, episodeNumber, episodes]);

  const filteredPredictions = useMemo(() => {
    const filtered: Record<number, PredictionAndPredOnly[] | undefined> = {};
    Object.keys(combinedPredictions).forEach((key) => {
      const numKey = Number(key);
      filtered[numKey] = combinedPredictions[numKey]?.filter((prediction) => {
        const hasReferenceFilters = filters.castaway.length > 0 || filters.tribe.length > 0;
        const referenceMatch =
          !hasReferenceFilters ||
          (prediction.referenceType === 'Castaway' && filters.castaway.includes(prediction.referenceId)) ||
          (prediction.referenceType === 'Tribe' && filters.tribe.includes(prediction.referenceId));
        const memberMatch = filters.member.length === 0 || filters.member.includes(prediction.predictionMakerId);
        const eventEpNum = prediction.eventEpisodeNumber;
        const eventMatch =
          filters.event.length === 0 ||
          (eventEpNum && allEvents[eventEpNum]?.some(
            (e) => e.eventName === prediction.eventName && filters.event.includes(e.eventName)
          ));
        return referenceMatch && memberMatch && eventMatch;
      });
    });
    return filtered;
  }, [allEvents, combinedPredictions, filters.castaway, filters.event, filters.member, filters.tribe]);

  const filteredEvents = useMemo(() => {
    const filtered: Record<number, EventWithReferencesAndPredOnly[] | undefined> = {};
    Object.keys(combinedEvents).forEach((key) => {
      const numKey = Number(key);
      filtered[numKey] = combinedEvents[numKey]
        ?.map((event): EventWithReferencesAndPredOnly | null => {
          const castawayMembers = selectionTimeline?.castawayMembers;
          const eventMembers =
            castawayMembers && filters.member.length > 0
              ? event.references.flatMap((ref) => {
                if (ref.type === 'Castaway' && numKey >= (league?.startWeek ?? 0)) {
                  const data = castawayMembers[ref.id];
                  return data?.[numKey] ?? data?.[data.length - 1] ?? [];
                }
                return findTribeCastaways(tribesTimeline ?? {}, eliminations ?? [], ref.id, numKey)
                  .flatMap((cid) => {
                    if (numKey < (league?.startWeek ?? 0)) return [];
                    const data = castawayMembers[cid];
                    return data?.[numKey] ?? data?.[data.length - 1] ?? [];
                  });
              })
              : [];
          Object.entries(selectionTimeline?.secondaryPicks ?? {}).forEach(([memberId, picks]) => {
            if (event.references.some((ref) => ref.type === 'Castaway' && picks[numKey] === ref.id))
              eventMembers.push(Number(memberId));
          });
          const castawayMatch = filters.castaway.length === 0 || event.references.some((ref) => {
            if (ref.type === 'Castaway') return filters.castaway.includes(ref.id);
            if (ref.type === 'Tribe') {
              const tribeCastaways = findTribeCastaways(tribesTimeline ?? {}, eliminations ?? [], ref.id, numKey);
              return tribeCastaways.some((cid) => filters.castaway.includes(cid));
            }
            return false;
          });
          const tribeMatch = filters.tribe.length === 0 || event.references.some((ref) => {
            if (ref.type === 'Tribe') return filters.tribe.includes(ref.id);
            if (ref.type === 'Castaway') {
              const tribeCastaways = filters.tribe.flatMap((tribeId) =>
                findTribeCastaways(tribesTimeline ?? {}, eliminations ?? [], tribeId, numKey));
              return tribeCastaways.includes(ref.id);
            }
            return false;
          });
          const memberMatch = filters.member.length === 0 || eventMembers.some((ref) => filters.member.includes(ref));
          const eventMatch = filters.event.length === 0 || filters.event.includes(event.eventName);
          const keep = castawayMatch && tribeMatch && memberMatch && eventMatch;
          const hasPredictions = filteredPredictions[numKey]?.some((p) => p.eventId === event.eventId);
          if (keep) return { ...event, predOnly: false };
          else if (hasPredictions) return { ...event, predOnly: true };
          return null;
        })
        .filter((event): event is EventWithReferencesAndPredOnly => event !== null);
    });
    return filtered;
  }, [combinedEvents, eliminations, filteredPredictions, filters.castaway, filters.event, filters.member, filters.tribe, league?.startWeek, selectionTimeline?.castawayMembers, selectionTimeline?.secondaryPicks, tribesTimeline]);

  const filteredPredictionsWithPredOnly = useMemo(() => {
    const result: Record<number, PredictionAndPredOnly[] | undefined> = {};
    Object.keys(filteredPredictions).forEach((key) => {
      const numKey = Number(key);
      result[numKey] = filteredPredictions[numKey]?.map((prediction) => {
        const event = filteredEvents[numKey]?.find((e) => e.eventId === prediction.eventId);
        return { ...prediction, predOnly: event?.predOnly ?? false };
      });
    });
    return result;
  }, [filteredPredictions, filteredEvents]);

  const noTribes = useMemo(
    () =>
      episodeNumber !== -1 &&
      !combinedEvents[episodeNumber]?.some((e) => e.references.some((r) => r.type === 'Tribe')) &&
      !combinedPredictions[episodeNumber]?.some((p) => p.referenceType === 'Tribe') &&
      !mockEvents?.some((e) => e.references.some((r) => r.type === 'Tribe')),
    [combinedEvents, combinedPredictions, episodeNumber, mockEvents]
  );

  const noMembers = useMemo(() => !selectionTimeline || !league, [selectionTimeline, league]);

  const streakGroupsByEpisode = useMemo(() => {
    const { tribesTimeline: tt, eliminations: el, tribes, castaways } = seasonData;
    const memberCastaways = leagueData?.selectionTimeline?.memberCastaways;
    const tribesById = new Map((tribes ?? []).map((t) => [t.tribeId, t]));
    const castawaysById = new Map((castaways ?? []).map((c) => [c.castawayId, c]));

    const findCastawayTribeColor = (castawayId: number, epNum: number): string | null => {
      if (!tt) return null;
      const timeline = Object.entries(tt)
        .filter(([ep]) => parseInt(ep) <= epNum)
        .sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
      for (const [, tribesInEp] of timeline) {
        for (const [tribeIdStr, members] of Object.entries(tribesInEp)) {
          if (members.includes(castawayId)) {
            return tribesById.get(parseInt(tribeIdStr))?.tribeColor ?? null;
          }
        }
      }
      return null;
    };

    const buildGroupsForEpisode = (epNum: number): Record<number, StreakMember[]> => {
      const groups: Record<number, StreakMember[]> = {};

      Object.entries(leagueData?.streaks ?? {}).forEach(([memberId, episodeStreaks]) => {
        const streakValue = episodeStreaks[epNum] ?? 0;
        if (streakValue <= 0) return;

        const mid = Number(memberId);
        const member = leagueData?.leagueMembers?.members.find((m) => m.memberId === mid);
        if (!member) return;

        const castawaySelections = memberCastaways?.[mid];
        const selectionLength = castawaySelections?.length ?? 0;
        const castawayId = castawaySelections?.[Math.min(selectionLength - 1, epNum)] ?? null;
        const castaway = castawayId ? castawaysById.get(castawayId) ?? null : null;
        const tribeColor = castawayId ? findCastawayTribeColor(castawayId, epNum) : null;

        if (filters.member.length > 0 && !filters.member.includes(mid)) return;
        if (filters.castaway.length > 0) {
          if (!castawayId || !filters.castaway.includes(castawayId)) return;
        }
        if (filters.tribe.length > 0 && castawayId) {
          const memberInFilteredTribe = filters.tribe.some((tribeId) => {
            const tribeCastaways = findTribeCastaways(tt ?? {}, el ?? [], tribeId, epNum);
            return tribeCastaways.includes(castawayId);
          });
          if (!memberInFilteredTribe) return;
        }

        const streakPointValue = Math.min(
          streakValue,
          leagueData?.leagueSettings?.survivalCap ?? streakValue
        );
        groups[streakPointValue] ??= [];
        groups[streakPointValue].push({ member, castaway: castaway ?? null, tribeColor });
      });

      return groups;
    };

    const result: Record<number, Record<number, StreakMember[]>> = {};
    const episodeNumbers = episodeNumber === -1
      ? (episodes ?? []).map((ep) => ep.episodeNumber)
      : [episodeNumber];
    for (const epNum of episodeNumbers) {
      result[epNum] = buildGroupsForEpisode(epNum);
    }
    return result;
  }, [episodeNumber, episodes, filters.castaway, filters.member, filters.tribe, leagueData, seasonData]);

  return (
    <View className={cn('bg-card', className)}>
      {episodes
        ?.filter((episode) => episodeNumber === -1 || episode.episodeNumber === episodeNumber)
        .map((episode) => (
          <Fragment key={`timeline-${episode.episodeNumber}`}>
            {episodeNumber === -1 && (
              <View className='border-t-2 border-primary/20 bg-primary/10 px-4 py-3'>
                <Text className='text-center text-sm font-black uppercase tracking-wider text-foreground'>
                  Episode {episode.episodeNumber}: {episode.title}
                </Text>
              </View>
            )}

            <EpisodeScrollContainer>
              {(scrollX) => (
                <EpisodeEventsTableBody
                  seasonId={episode.seasonId}
                  episodeNumber={episode.episodeNumber}
                  mockEvents={mockEvents}
                  filteredEvents={filteredEvents[episode.episodeNumber] ?? []}
                  filteredPredictions={filteredPredictionsWithPredOnly[episode.episodeNumber] ?? []}
                  predictionEnrichmentEvents={enrichmentOnlyEvents}
                  edit={edit}
                  noTribes={noTribes}
                  filters={filters}
                  noMembers={noMembers}
                  seasonData={seasonData}
                  leagueData={leagueData}
                  scrollX={scrollX} />
              )}
            </EpisodeScrollContainer>

            {!edit && Object.keys(streakGroupsByEpisode[episode.episodeNumber] ?? {}).length > 0 && (
              <>
                <View
                  className='w-full bg-white pl-4 justify-center border-b-2 border-primary/20'
                  pointerEvents='none'>
                  <Text
                    allowFontScaling={false}
                    className='text-xs font-bold uppercase tracking-wider text-muted-foreground py-2'>
                    Survival Streaks
                  </Text>
                </View>
                {Object.entries(streakGroupsByEpisode[episode.episodeNumber] ?? {})
                  .sort(([a], [b]) => Number(b) - Number(a))
                  .map(([streakPointValue, streakMembers]) => (
                    <StreakRow
                      key={streakPointValue}
                      streakPointValue={Number(streakPointValue)}
                      streakMembers={streakMembers}
                      streaksMap={leagueData!.streaks!}
                      episodeNumber={episode.episodeNumber}
                      shotInTheDarkStatus={leagueData?.shotInTheDarkStatus} />
                  ))}
              </>
            )}
          </Fragment>
        ))}
    </View>
  );
}
