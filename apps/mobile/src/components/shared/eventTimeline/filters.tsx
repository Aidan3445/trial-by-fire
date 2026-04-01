import { useEffect, useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';

import SearchableSelect from '~/components/common/searchableSelect';
import SearchableMultiSelect from '~/components/common/searchableMultiSelect';
import AirStatus from '~/components/shared/episodes/airStatus';
import { BaseEventFullName } from '~/lib/events';
import { getAirStatusPollingInterval } from '~/lib/episodes';
import { type SeasonsDataQuery } from '~/types/seasons';
import {
  type SelectionTimelines,
  type League,
  type LeagueRules,
  type LeagueSettings,
} from '~/types/leagues';
import { type LeagueMember } from '~/types/leagueMembers';
import { type CustomEvents, type Predictions } from '~/types/events';

export interface LeagueData {
  league: League | undefined;
  selectionTimeline: SelectionTimelines | undefined;
  customEvents: CustomEvents | undefined;
  basePredictions: Predictions | undefined;
  leagueRules: LeagueRules | undefined;
  leagueMembers:
  | {
    loggedIn?: LeagueMember;
    members: LeagueMember[];
  }
  | undefined;
  streaks?: Record<number, Record<number, number>>;
  leagueSettings?: LeagueSettings;
  shotInTheDarkStatus: Record<
    number,
    {
      episodeNumber: number;
      status: 'pending' | 'saved' | 'wasted';
    } | null
  >;
}

export interface TimelineFiltersProps {
  seasonData: SeasonsDataQuery;
  leagueData?: LeagueData;
  setFilterCastaway: (_castawayIds: number[]) => void;
  setFilterTribe: (_tribeIds: number[]) => void;
  setFilterMember: (_memberIds: number[]) => void;
  setFilterEvent: (_eventNames: string[]) => void;
  setSelectedEpisode: (_episodeNumber?: number) => void;
  filterCastaway: number[];
  filterTribe: number[];
  filterMember: number[];
  filterEvent: string[];
  selectedEpisode?: number;
  hideMemberFilter?: boolean;
}

export default function TimelineFilters({
  seasonData,
  leagueData,
  setFilterCastaway,
  setFilterTribe,
  setFilterMember,
  setFilterEvent,
  setSelectedEpisode,
  filterCastaway,
  filterTribe,
  filterMember,
  filterEvent,
  selectedEpisode,
  hideMemberFilter = false,
}: TimelineFiltersProps) {
  const { leagueRules, leagueMembers } = leagueData ?? {};

  // Derive data from seasonData prop
  const castaways = useMemo(() => seasonData.castaways, [seasonData.castaways]);
  const tribes = useMemo(() => seasonData.tribes, [seasonData.tribes]);
  const episodes = useMemo(() => seasonData.episodes, [seasonData.episodes]);

  // Accordion state
  const [isExpanded, setIsExpanded] = useState(false);
  const expandProgress = useSharedValue(0);

  // State to trigger re-renders for air status updates
  const [pollingTick, setPollingTick] = useState(0);

  useEffect(() => {
    if (selectedEpisode !== undefined || !episodes) return;

    const latestEpisode =
      episodes.find((episode) => episode.airStatus === 'Airing') ??
      episodes.findLast((episode) => episode.airStatus === 'Aired') ??
      episodes[0];

    setSelectedEpisode(latestEpisode?.episodeNumber);
  }, [episodes, selectedEpisode, setSelectedEpisode]);

  // Dynamic polling based on next air status change
  useEffect(() => {
    const pollingInterval = getAirStatusPollingInterval(episodes);

    // No upcoming status changes, no need to poll
    if (pollingInterval === null) return;

    // eslint-disable-next-line no-undef
    const timeoutId = setTimeout(() => {
      // Trigger re-render by updating state, which will recalculate the next interval
      setPollingTick((prev) => prev + 1);
    }, pollingInterval);

    // eslint-disable-next-line no-undef
    return () => clearTimeout(timeoutId);
  }, [episodes, pollingTick]);

  // Toggle accordion
  const toggleExpanded = () => {
    setIsExpanded((prev) => !prev);
    expandProgress.value = withTiming(isExpanded ? 0 : 1, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: expandProgress.value,
    maxHeight: interpolate(expandProgress.value, [0, 1], [0, 500]),
  }));

  // Build episode options for Select
  const episodeOptions = useMemo(() => [
    {
      value: -1,
      label: 'All Episodes'
    },
    ...(episodes?.map((episode) => ({
      value: episode.episodeNumber,
      label: `EP ${episode.episodeNumber}: ${episode.title}`,
      renderLabel: () => (
        <View className='flex-1'>
          <Text className='text-foreground'>
            <Text className='font-bold'>EP {episode.episodeNumber}: </Text>
            {episode.title}
            {'  '}
            <View style={{ transform: [{ translateY: 2 }] }}>
              <AirStatus
                airDate={episode.airDate}
                airStatus={episode.airStatus}
                showTime={false}
                showDate={false} />
            </View>
          </Text>
        </View>
      ),
    })) ?? []),
  ], [episodes]);

  // Build event filter options
  const eventOptions = useMemo(
    () => [
      ...Object.entries(BaseEventFullName).map(([eventName, eventFullName]) => ({
        value: eventName,
        label: eventFullName,
      })),
      ...(leagueRules?.custom && Object.keys(leagueRules.custom).length > 0
        ? Object.values(leagueRules?.custom ?? []).map((event) => ({
          value: event.eventName,
          label: event.eventName,
        }))
        : []),
    ],
    [leagueRules?.custom]
  );

  // Helper to get display name for selected tribe
  const getSelectedTribeLabel = () => {
    if (filterTribe.length === 0) return 'All Tribes';
    if (filterTribe.length === 1) {
      const tribe = tribes?.find((t) => t.tribeId === filterTribe[0]);
      return tribe?.tribeName ?? '1 Tribe Selected';
    }
    return `${filterTribe.length} Tribes Selected`;
  };

  // Helper to get display name for selected member
  const getSelectedMemberLabel = () => {
    if (filterMember.length === 0) return 'All Members';
    if (filterMember.length === 1) {
      const member = leagueMembers?.members.find((m) => m.memberId === filterMember[0]);
      return member?.displayName ?? '1 Member Selected';
    }
    return `${filterMember.length} Members Selected`;
  };

  // Helper to get display name for selected event
  const getSelectedEventLabel = () => {
    if (filterEvent.length === 0) return 'All Events';
    if (filterEvent.length === 1) {
      const eventName = filterEvent[0]!;
      return BaseEventFullName[eventName as keyof typeof BaseEventFullName] ?? eventName;
    }
    return `${filterEvent.length} Events Selected`;
  };

  // Helper to get display name for selected castaway
  const getSelectedCastawayLabel = () => {
    if (filterCastaway.length === 0) return 'All Castaways';
    if (filterCastaway.length === 1) {
      const castaway = castaways?.find((c) => c.castawayId === filterCastaway[0]);
      return castaway?.fullName ?? '1 Castaway Selected';
    }
    return `${filterCastaway.length} Castaways Selected`;
  };

  return (
    <View className='w-full'>
      {/* Episode Select */}
      <View className='flex-row items-center justify-center w-full'>
        <SearchableSelect
          options={episodeOptions}
          selectedValue={selectedEpisode}
          onSelect={setSelectedEpisode}
          placeholder='Search episodes...'
          emptyMessage='No episodes found.' />
      </View>

      {/* Filters Accordion Trigger */}
      <Pressable
        onPress={toggleExpanded}
        className='w-full flex-row items-center justify-center py-2'>
        <Text className='text-xs font-bold uppercase tracking-wider text-foreground'>
          Filters
        </Text>
        <Animated.View style={chevronStyle} className='ml-2'>
          <ChevronDown size={16} className='text-foreground' />
        </Animated.View>
      </Pressable>

      {/* Accordion Content */}
      <Animated.View style={contentStyle} className='overflow-hidden'>
        <View className='flex-row flex-wrap items-center justify-evenly gap-4 pb-4'>
          {/* Castaway Filter */}
          {castaways && (
            <View className='items-center gap-2'>
              <Text className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Castaway Filter
              </Text>
              <SearchableMultiSelect
                options={castaways.map((castaway) => ({
                  value: castaway.castawayId,
                  label: castaway.fullName,
                }))}
                selectedValues={filterCastaway}
                onToggleSelect={(value) => setFilterCastaway(value)}
                placeholder='Search castaways...'>
                <View>
                  <Text className='text-sm text-foreground'>
                    {getSelectedCastawayLabel()}
                  </Text>
                </View>
              </SearchableMultiSelect>
            </View>
          )}

          {/* Tribe Filter */}
          {tribes && (
            <View className='items-center gap-2'>
              <Text className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Tribe Filter
              </Text>
              <SearchableMultiSelect
                options={tribes.map((tribe) => ({
                  value: tribe.tribeId,
                  label: tribe.tribeName,
                }))}
                selectedValues={filterTribe}
                onToggleSelect={(value) => setFilterTribe(value)}
                placeholder='Search tribes...'>
                <View>
                  <Text className='text-sm text-foreground'>
                    {getSelectedTribeLabel()}
                  </Text>
                </View>
              </SearchableMultiSelect>
            </View>
          )}

          {/* Member Filter */}
          {!hideMemberFilter && leagueMembers && (
            <View className='items-center gap-2'>
              <Text className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                Member Filter
              </Text>
              <SearchableMultiSelect
                options={leagueMembers.members.map((member) => ({
                  value: member.memberId,
                  label: member.displayName,
                }))}
                selectedValues={filterMember}
                onToggleSelect={(value) => setFilterMember(value)}
                placeholder='Search members...'>
                <View>
                  <Text className='text-sm text-foreground'>
                    {getSelectedMemberLabel()}
                  </Text>
                </View>
              </SearchableMultiSelect>
            </View>
          )}

          {/* Event Filter */}
          <View className='items-center gap-2'>
            <Text className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              Event Filter
            </Text>
            <SearchableMultiSelect
              options={eventOptions}
              selectedValues={filterEvent}
              onToggleSelect={(value) => setFilterEvent(value)}
              placeholder='Search events...'>
              <View>
                <Text className='text-sm text-foreground'>
                  {getSelectedEventLabel()}
                </Text>
              </View>
            </SearchableMultiSelect>
          </View>
        </View>
      </Animated.View>
    </View >
  );
}
