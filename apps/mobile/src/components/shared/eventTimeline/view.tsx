import { useState, useMemo } from 'react';
import { Text, View } from 'react-native';
import TimelineFilters, { type LeagueData } from '~/components/shared/eventTimeline/filters';
import EpisodeEvents from '~/components/shared/eventTimeline/table/view';
import { type SeasonsDataQuery } from '~/types/seasons';

interface EventTimelineProps {
  seasonData?: SeasonsDataQuery | null;
  leagueData?: LeagueData;
  hideMemberFilter?: boolean;
}

export default function EventTimeline({
  seasonData,
  leagueData,
  hideMemberFilter = false,
}: EventTimelineProps) {
  const [filterCastaway, setFilterCastaway] = useState<number[]>([]);
  const [filterTribe, setFilterTribe] = useState<number[]>([]);
  const [filterMember, setFilterMember] = useState<number[]>([]);
  const [filterEvent, setFilterEvent] = useState<string[]>([]);
  const [selectedEpisode, setSelectedEpisode] = useState<number>();

  const seasonDataWithDates = useMemo(() => {
    if (!seasonData) return seasonData;

    // Convert date strings back to Date objects after crossing server/client boundary
    // if dates are already Date objects, return as is. One date check is sufficient
    if (seasonData.episodes?.[0]?.airDate instanceof Date) return seasonData;
    return {
      ...seasonData,
      episodes: seasonData.episodes?.map((ep) => ({
        ...ep,
        airDate: new Date(ep.airDate),
      })),
      season: {
        ...seasonData.season,
        premiereDate: new Date(seasonData.season.premiereDate),
        finaleDate: seasonData.season.finaleDate
          ? new Date(seasonData.season.finaleDate)
          : null,
      },
    };
  }, [seasonData]);

  if (!seasonData || !seasonDataWithDates) {
    return null;
  }

  return (
    <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20'>
      <View className='z-10 p-4 pb-2'>
        <View className='flex-row items-center gap-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black tracking-tight uppercase'>
            Activity
          </Text>
        </View>
        <View className='flex-row items-center gap-2 ml-2.5'>
          <Text className='text-xs font-bold text-primary uppercase tracking-wider'>
            {seasonData.season.name}
          </Text>
        </View>
      </View>

      <View className='relative z-10 px-4'>
        <TimelineFilters
          seasonData={seasonDataWithDates}
          leagueData={leagueData}
          filterCastaway={filterCastaway}
          setFilterCastaway={setFilterCastaway}
          filterTribe={filterTribe}
          setFilterTribe={setFilterTribe}
          filterMember={filterMember}
          setFilterMember={setFilterMember}
          filterEvent={filterEvent}
          setFilterEvent={setFilterEvent}
          selectedEpisode={selectedEpisode}
          setSelectedEpisode={setSelectedEpisode}
          hideMemberFilter={hideMemberFilter} />
      </View>
      <View className='relative z-10'>
        {selectedEpisode && (
          <EpisodeEvents
            episodeNumber={selectedEpisode}
            seasonData={seasonDataWithDates}
            leagueData={leagueData}
            filters={{
              castaway: filterCastaway,
              tribe: filterTribe,
              member: filterMember,
              event: filterEvent,
            }} />
        )}
      </View>
    </View>
  );
}
