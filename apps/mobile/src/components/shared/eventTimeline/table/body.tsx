import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { type SharedValue } from 'react-native-reanimated';
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
  scrollX: SharedValue<number>;
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
  scrollX,
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

  const baseEventsToUse = baseEvents.filter((event) => !filteredEvents.some((fe) => fe.eventId === event.eventId && fe.predOnly));

  return (
    <View className='min-w-full'>
      {baseEventsToUse.length + enrichedMockEvents.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          label='Events'
          scrollX={scrollX} />
      )}

      {enrichedMockEvents.map((mock, idx) => (
        <EventRow
          key={`mock-${idx}`}
          className='bg-yellow-500'
          event={mock}
          isMock
          editCol={edit}
          noPoints={!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          seasonId={seasonData.season.seasonId}
          scrollX={scrollX} />
      ))}

      {baseEventsToUse
        .map((event, idx) => (
          <EventRow
            key={`base-${idx}`}
            event={event}
            editCol={edit}
            noPoints={!leagueData}
            noTribes={noTribes}
            noMembers={noMembers}
            seasonId={seasonData.season.seasonId}
            scrollX={scrollX} />
        ))}

      {customEvents.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          label='Custom Events'
          scrollX={scrollX} />
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
            scrollX={scrollX} />
        ))}

      {enrichedPredictions.length + enrichedMockPredictions.length > 0 && (
        <HeaderRow
          edit={edit}
          leagueData={!!leagueData}
          noTribes={noTribes}
          noMembers={noMembers}
          noNotes
          label='Predictions'
          scrollX={scrollX} />
      )}
      {enrichedMockPredictions.map((mock, idx) => (
        <PredictionRow
          key={`mock-pred-${idx}`}
          className='bg-yellow-500'
          prediction={mock}
          editCol={edit}
          noMembers={noMembers}
          noTribes={noTribes}
          scrollX={scrollX} />
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
          scrollX={scrollX} />
      ))}
    </View>
  );
}
