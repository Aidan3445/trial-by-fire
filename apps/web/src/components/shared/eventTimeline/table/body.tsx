'use client';

import { TableCell, TableHead, TableRow } from '~/components/common/table';
import { type EventWithReferencesAndPredOnly, type EpisodeEventsProps, type PredictionAndPredOnly } from '~/components/shared/eventTimeline/table/view';
import { type EnrichedEvent } from '~/types/events';
import { useEnrichEvents } from '~/hooks/seasons/enrich/useEnrichEvents';
import { useEnrichPredictions } from '~/hooks/seasons/enrich/useEnrichPredictions';
import PredictionRow from '~/components/shared/eventTimeline/table/row/predictionRow';
import EventRow from '~/components/shared/eventTimeline/table/row/eventRow';
import { useMemo } from 'react';
import { type StreakMember } from '~/types/leagueMembers';
import StreakRow from '~/components/shared/eventTimeline/table/row/streakRow';
import { eventSortOrder } from '~/lib/events';
import HeaderRow from '~/components/shared/eventTimeline/table/row/headerRow';
import { findTribeCastaways } from '~/lib/utils';

interface EpisodeEventsTableBodyProps extends EpisodeEventsProps {
  seasonId: number;
  filteredEvents: EventWithReferencesAndPredOnly[];
  filteredPredictions: PredictionAndPredOnly[];
  predictionEnrichmentEvents?: EventWithReferencesAndPredOnly[];
  index: number;
  noMembers: boolean;
  noTribes?: boolean;
}

export default function EpisodeEventsTableBody({
  seasonData,
  leagueData,
  episodeNumber,
  mockEvents,
  filteredEvents,
  filteredPredictions,
  predictionEnrichmentEvents,
  edit,
  filters,
  index,
  noMembers,
  noTribes
}: EpisodeEventsTableBodyProps) {
  const enrichedEvents = useEnrichEvents(seasonData, filteredEvents, leagueData);
  const enrichedMockEvents = useEnrichEvents(seasonData, mockEvents ?? [], leagueData);
  const enrichedEnrichmentEvents = useEnrichEvents(seasonData, predictionEnrichmentEvents ?? [], leagueData);

  const eventsForPredictionEnrichment = useMemo(() => [
    ...enrichedEvents,
    ...enrichedEnrichmentEvents,
  ], [enrichedEvents, enrichedEnrichmentEvents]);

  const enrichedPredictions = useEnrichPredictions(
    seasonData,
    eventsForPredictionEnrichment,
    filteredPredictions,
    leagueData
  );
  const enrichedMockPredictions = useEnrichPredictions(
    seasonData,
    enrichedMockEvents,
    filteredPredictions,
    leagueData
  );

  // Group members by their streak value for this episode, with castaway info and filtering
  const streakGroups = useMemo(() => {
    const { tribesTimeline, eliminations, tribes, castaways } = seasonData;
    const memberCastaways = leagueData?.selectionTimeline?.memberCastaways;
    const tribesById = new Map((tribes ?? []).map(t => [t.tribeId, t]));
    const castawaysById = new Map((castaways ?? []).map(c => [c.castawayId, c]));

    const findCastawayTribeColor = (castawayId: number): string | null => {
      if (!tribesTimeline) return null;
      const timeline = Object.entries(tribesTimeline)
        .filter(([ep]) => parseInt(ep) <= episodeNumber)
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

    const groups: Record<number, StreakMember[]> = {};

    Object.entries(leagueData?.streaks ?? {}).forEach(([memberId, episodeStreaks]) => {
      const streakValue = episodeStreaks[episodeNumber] ?? 0;
      if (streakValue <= 0) return;

      const mid = Number(memberId);
      const member = leagueData?.leagueMembers?.members.find(m => m.memberId === mid);
      if (!member) return;

      // Look up the castaway this member has selected for this episode
      const castawaySelections = memberCastaways?.[mid];
      const selectionLength = castawaySelections?.length ?? 0;
      const castawayId = castawaySelections?.[Math.min(selectionLength - 1, episodeNumber)] ?? null;
      const castaway = castawayId ? castawaysById.get(castawayId) ?? null : null;
      const tribeColor = castawayId ? findCastawayTribeColor(castawayId) : null;

      // Apply filters: member must match active filters
      if (filters.member.length > 0 && !filters.member.includes(mid)) return;
      if (filters.castaway.length > 0) {
        if (!castawayId || !filters.castaway.includes(castawayId)) return;
      }
      if (filters.tribe.length > 0 && castawayId) {
        const memberInFilteredTribe = filters.tribe.some((tribeId) => {
          const tribeCastaways = findTribeCastaways(tribesTimeline ?? {}, eliminations ?? [], tribeId, episodeNumber);
          return tribeCastaways.includes(castawayId);
        });
        if (!memberInFilteredTribe) return;
      }

      const streakPointValue = Math.min(streakValue, leagueData?.leagueSettings?.survivalCap ?? streakValue);
      groups[streakPointValue] ??= [];
      groups[streakPointValue].push({ member, castaway: castaway ?? null, tribeColor });
    });

    return groups;
  }, [episodeNumber, filters.castaway, filters.member, filters.tribe, leagueData, seasonData]);

  const { baseEvents, customEvents } = enrichedEvents.reduce((acc, event) => {
    if (event.eventSource === 'Base') {
      acc.baseEvents.push(event);
    } else if (event.eventType === 'Direct') {
      acc.customEvents.push(event);
    }
    return acc;
  }, { baseEvents: [] as EnrichedEvent[], customEvents: [] as EnrichedEvent[] });

  if (!enrichedEvents.length && !enrichedPredictions.length && !mockEvents) {
    const hasFilters =
      filters.member.length > 0 ||
      filters.castaway.length > 0 ||
      filters.event.length > 0 ||
      filters.tribe.length > 0;

    return (
      <TableRow className='bg-card'>
        <TableCell colSpan={7} className='text-center text-muted-foreground'>
          No events for episode {episodeNumber} {hasFilters ? 'with the selected filters' : ''}
        </TableCell>
      </TableRow>
    );
  }

  const baseEventsToUse = baseEvents
    .filter(event => !filteredEvents.some(fe => fe.eventId === event.eventId && fe.predOnly))
    .sort((a, b) => eventSortOrder(a.eventName) - eventSortOrder(b.eventName));

  return (
    <>
      {enrichedMockEvents.map((mock, index) =>
        <EventRow key={index} className='bg-yellow-500' event={mock} editCol={edit} isMock noMembers={noMembers} noPoints={!leagueData} />
      )}
      {index > 0 && baseEventsToUse.length + enrichedMockEvents.length > 0 &&
        <TableRow className='bg-white border-b-2 border-primary/20 hover:bg-white/80 px-4 gap-4 items-center text-nowrap'>
          {edit && (baseEventsToUse.length + enrichedMockEvents.length > 0 &&
            <TableHead className='sticky left-0 bg-white w-0 font-bold uppercase text-xs tracking-wider'>
              <div className='sm:border-r-none border-r-2 border-r-secondary h-full place-content-center'>
                Edit
              </div>
            </TableHead>
          )}
          <TableHead className='sticky left-0 font-bold uppercase text-xs tracking-wider w-0 bg-white pr-0'>
            <div className='max-w sm:border-r-none border-r-2 border-r-secondary h-full place-content-center'>
              Event
            </div>
          </TableHead>
          {leagueData && !edit && (
            <TableHead className='text-center font-bold uppercase text-xs tracking-wider'>
              Points
            </TableHead>
          )}
          <TableHead className='font-bold uppercase text-xs tracking-wider'>
            {noTribes ? null : 'Tribes'}
          </TableHead>
          <TableHead className='text-left font-bold uppercase text-xs tracking-wider'>
            Castaways
          </TableHead>
          {!noMembers && (
            <TableHead className='w-full font-bold uppercase text-xs tracking-wider'>
              Members
            </TableHead>
          )}
          <TableHead className='font-bold uppercase text-xs tracking-wider text-right'>
            Notes
          </TableHead>
        </TableRow>
      }
      {baseEventsToUse
        .map((event, index) => (
          <EventRow key={index} event={event} editCol={edit} noMembers={noMembers} noPoints={!leagueData} />
        ))}
      {customEvents.length > 0 && (
        <HeaderRow
          label='Custom Events'
          leagueData={!!leagueData}
          edit={edit}
          noTribes={noTribes}
          noMembers={noMembers} />
      )}
      {customEvents
        .filter(event => !filteredEvents.some(fe => fe.eventId === event.eventId && fe.predOnly))
        .map((event, index) => (
          <EventRow key={index} event={event} editCol={edit} noMembers={noMembers} />
        ))}
      {enrichedPredictions.length + enrichedMockPredictions.length > 0 && (
        <HeaderRow
          label='Predictions'
          leagueData={!!leagueData}
          edit={edit}
          noTribes={noTribes}
          noMembers={noMembers} />
      )}
      {enrichedMockPredictions.map((mock, index) =>
        <PredictionRow key={index} className='bg-yellow-500' prediction={mock} editCol={edit} noMembers={noMembers} />
      )}
      {enrichedPredictions.map((prediction, index) =>
        <PredictionRow
          key={index}
          prediction={prediction}
          editCol={edit}
          noMembers={noMembers}
          defaultOpenMisses={
            prediction.misses.some(miss =>
              filters.member.includes(miss.member.memberId)
              || (miss.reference?.type === 'Castaway' && filters.castaway.includes(miss.reference.id))
              || (miss.reference?.type === 'Tribe' && filters.tribe.includes(miss.reference.id))
            )
          } />
      )}
      {!edit && Object.keys(streakGroups).length > 0 && (
        <>
          <HeaderRow
            label='Survival Streaks'
            leagueData={!!leagueData}
            edit={edit}
            noTribes={noTribes}
            noMembers={noMembers}
            labelOnly />
          {Object.entries(streakGroups)
            .sort(([a], [b]) => Number(b) - Number(a))
            .map(([streakPointValue, streakMembers]) => (
              <StreakRow
                key={streakPointValue}
                streakPointValue={Number(streakPointValue)}
                streakMembers={streakMembers}
                streaksMap={leagueData!.streaks!}
                episodeNumber={episodeNumber}
                shotInTheDarkStatus={leagueData?.shotInTheDarkStatus} />
            ))}
        </>
      )}
    </>
  );
}

