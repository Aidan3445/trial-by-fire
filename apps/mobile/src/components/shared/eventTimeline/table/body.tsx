import { View, Text } from 'react-native';
import { type ReactNode, useMemo } from 'react';
import {
  type EventWithReferencesAndPredOnly,
  type EpisodeEventsProps,
  type PredictionAndPredOnly,
} from '~/components/shared/eventTimeline/table/view';
import { type EnrichedEvent } from '~/types/events';
import { useEnrichEvents } from '~/hooks/seasons/enrich/useEnrichEvents';
import { useEnrichPredictions } from '~/hooks/seasons/enrich/useEnrichPredictions';
import PredictionRow from '~/components/shared/eventTimeline/table/row/predictionRow';
import EventRow from '~/components/shared/eventTimeline/table/row/eventRow';
import HeaderRow from '~/components/shared/eventTimeline/table/row/headerRow';

interface EpisodeEventsTableBodyProps extends EpisodeEventsProps {
  seasonId: number;
  filteredEvents: EventWithReferencesAndPredOnly[];
  filteredPredictions: PredictionAndPredOnly[];
  predictionEnrichmentEvents?: EventWithReferencesAndPredOnly[];
  noMembers: boolean;
  noTribes?: boolean;
  onSectionLayout?: (_label: string, _y: number) => void;
  onRowLayout: (_id: string, _y: number, _height: number, _node: ReactNode) => void
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
  noMembers,
  noTribes,
  onSectionLayout,
  onRowLayout,
}: EpisodeEventsTableBodyProps) {
  const enrichedEvents = useEnrichEvents(seasonData, filteredEvents, leagueData);
  const enrichedMockEvents = useEnrichEvents(seasonData, mockEvents ?? [], leagueData);
  const enrichedEnrichmentEvents = useEnrichEvents(
    seasonData,
    predictionEnrichmentEvents ?? [],
    leagueData
  );

  const eventsForPredictionEnrichment = useMemo(
    () => [...enrichedEvents, ...enrichedEnrichmentEvents],
    [enrichedEvents, enrichedEnrichmentEvents]
  );

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

  const { baseEvents, customEvents } = enrichedEvents.reduce((acc, event) => {
    if (event.eventSource === 'Base') {
      acc.baseEvents.push(event);
    } else if (event.eventType === 'Direct') {
      acc.customEvents.push(event);
    }
    return acc;
  },
    { baseEvents: [] as EnrichedEvent[], customEvents: [] as EnrichedEvent[] }
  );

  if (!enrichedEvents.length && !enrichedPredictions.length && !mockEvents) {
    const hasFilters =
      filters.member.length > 0 ||
      filters.castaway.length > 0 ||
      filters.event.length > 0 ||
      filters.tribe.length > 0;

    return (
      <View className='bg-card px-4 py-3 min-w-full'>
        <Text className='text-muted-foreground'>
          No events for episode {episodeNumber} {hasFilters ? 'with the selected filters' : ''}
        </Text>
      </View>
    );
  }

  return (
    <View className='min-w-full'>
      {enrichedEvents.length + enrichedMockEvents.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          label='Events'
          onSectionLayout={onSectionLayout} />
      )}

      {enrichedMockEvents.map((mock, idx) => (
        <EventRow
          key={`mock-${idx}`}
          className='bg-yellow-500'
          event={mock}
          editCol={edit}
          isMock
          noPoints={!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          onRowLayout={onRowLayout} />
      ))}

      {baseEvents
        .filter((event) => !filteredEvents.some((fe) => fe.eventId === event.eventId && fe.predOnly))
        .map((event, idx) => (
          <EventRow
            key={`base-${idx}`}
            event={event}
            editCol={edit}
            noPoints={!leagueData}
            noTribes={noTribes}
            noMembers={noMembers}
            seasonId={seasonData.season.seasonId}
            onRowLayout={onRowLayout} />
        ))}

      {customEvents.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          label='Custom Events'
          onSectionLayout={onSectionLayout} />
      )}
      {customEvents
        .filter((event) => !filteredEvents.some((fe) => fe.eventId === event.eventId && fe.predOnly))
        .map((event, idx) => (
          <EventRow
            key={`custom-${idx}`}
            event={event}
            editCol={edit}
            noPoints={!leagueData}
            noTribes={noTribes}
            noMembers={noMembers}
            onRowLayout={onRowLayout} />
        ))}

      {enrichedPredictions.length + enrichedMockPredictions.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          noNotes
          label='Predictions'
          onSectionLayout={onSectionLayout} />
      )}
      {enrichedMockPredictions.map((mock, idx) => (
        <PredictionRow
          key={`mock-pred-${idx}`}
          className='bg-yellow-500'
          prediction={mock}
          editCol={edit}
          noMembers={noMembers}
          noTribes={noTribes}
          onRowLayout={onRowLayout} />
      ))}
      {enrichedPredictions.map((prediction, idx) => (
        <PredictionRow
          key={`pred-${idx}`}
          prediction={prediction}
          editCol={edit}
          noTribes={noTribes}
          noMembers={noMembers}
          defaultOpenMisses={prediction.misses.some(
            (miss) =>
              filters.member.includes(miss.member.memberId) ||
              (miss.reference?.type === 'Castaway' &&
                filters.castaway.includes(miss.reference.id)) ||
              (miss.reference?.type === 'Tribe' && filters.tribe.includes(miss.reference.id))
          )}
          onRowLayout={onRowLayout} />
      ))}
    </View>
  );
}
