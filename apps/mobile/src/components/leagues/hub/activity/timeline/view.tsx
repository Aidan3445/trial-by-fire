'use client';

import EventTimeline from '~/components/shared/eventTimeline/view';
import { type SeasonsDataQuery } from '~/types/seasons';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';

/**
 * Wrapper component for EventTimeline that fetches league data.
 * Use this component on league routes where league context is available.
 * For non-league contexts (like seasons page), use EventTimeline directly.
 */
export default function LeagueTimeline() {
  const data = useLeagueData();

  if (!data?.episodes) {
    return null;
  }

  return (
    <EventTimeline seasonData={data as SeasonsDataQuery} leagueData={data} />
  );
}

