'use client';

import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import { useLeagues } from '~/hooks/user/useLeagues';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { useRouter } from 'expo-router';
import ActiveLeague from '~/components/home/activeleagues/activeLeague';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { useEffect, useMemo, useState } from 'react';
import { MAX_LEAGUE_MEMBERS_HOME_DISPLAY } from '~/lib/leagues';
import { type LeagueDetails } from '~/types/leagues';
import { cn } from '~/lib/utils';

export default function ActiveLeagues() {
  const router = useRouter();
  const { data: leagues } = useLeagues();
  const { ref, props, progressProps, setCarouselData } = useCarousel(leagues);
  const [inactive, setInactive] = useState<LeagueDetails[]>([]);

  useEffect(() => {
    const currentLeagues: LeagueDetails[] = [];
    const inactive: LeagueDetails[] = [];
    leagues?.forEach((leagueDetails) =>
      leagueDetails.league.status !== 'Inactive'
        ? currentLeagues.push(leagueDetails)
        : inactive.push(leagueDetails)
    );

    currentLeagues.sort((a, b) => {
      const statusOrder = { Draft: 0, Predraft: 1, Active: 2, Inactive: 3 };
      if (statusOrder[a.league.status] !== statusOrder[b.league.status]) {
        return statusOrder[a.league.status] - statusOrder[b.league.status];
      }
      return b.league.season.localeCompare(a.league.season);
    });
    setCarouselData(currentLeagues ?? []);
    setInactive(inactive);
  }, [leagues, setCarouselData]);

  const { carouselHeight, maxLeagueMembers } = useMemo(() => {
    const maxRows =
      props.data?.reduce((max, league) =>
        league?.league.status === 'Active'
          ? Math.max(max, league.memberCount)
          : Math.max(max, 2.5), // Min height for draft status is 2.5 rows
        0) ?? 0;
    if (maxRows < MAX_LEAGUE_MEMBERS_HOME_DISPLAY) {
      return { carouselHeight: 35 * maxRows + 130, maxLeagueMembers: maxRows };
    }
    return { carouselHeight: 35 * MAX_LEAGUE_MEMBERS_HOME_DISPLAY + 130, maxLeagueMembers: maxRows };
  }, [props.data]);

  if (!props.data || props.data.length === 0) {
    return (
      <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20 p-4'>
        <View className='flex-row items-center gap-1'>
          <View className='h-8 w-1 bg-primary rounded-full' />
          <Text className='text-2xl font-black tracking-tight uppercase text-foreground'>
            Your Leagues
          </Text>
        </View>
        <Text className='text-center text-sm font-medium text-muted-foreground leading-relaxed'>
          You are not a member of any active leagues.
          {'\n'}
          Join or create a league to get started!
        </Text>
        {inactive.length > 0 && (
          <Button
            className='mt-4 rounded-lg bg-primary/10 border border-primary/30 px-4 py-3'
            onPress={() => router.replace('/leagues')}>
            <Text className='text-sm text-center font-bold text-primary uppercase tracking-wider' allowFontScaling={false}>
              View Old Leagues
            </Text>
          </Button>
        )}
      </View>
    );
  }

  return (
    <View className={cn('relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20',
      props.data && props.data.length === 1 && 'pb-2.5')}>
      {/* Header */}
      <View className='p-4 pb-0'>
        <View className='flex-row items-end justify-between'>
          <View className='flex-row items-center gap-1'>
            <View className='h-8 w-1 bg-primary rounded-full' />
            <Text className='text-2xl font-black tracking-tight uppercase text-foreground'>
              Your Leagues
            </Text>
          </View>
          <Button
            className='rounded-md border border-primary/30 bg-primary/5 px-3 py-1.5 active:bg-primary/10'
            onPress={() => router.replace('/leagues')}>
            <Text className='text-xs font-bold text-primary uppercase tracking-wider' allowFontScaling={false}>
              View All
            </Text>
          </Button>
        </View>

        {/* Separator */}
        <View className='h-[2px] bg-primary/20 rounded-full my-2' />
      </View>

      {/* Carousel */}
      <Carousel
        ref={ref}
        height={carouselHeight}
        renderItem={({ item }) => (
          <View
            className='flex'
            style={{ height: carouselHeight }}>
            <ActiveLeague
              league={item.league}
              memberCount={item.memberCount}
              maxMembers={maxLeagueMembers} />
          </View>
        )}
        {...props}
        loop />

      {/* Pagination Footer */}
      {props.data && props.data.length > 1 && (
        <View className='items-center'>
          <Pagination.Basic {...progressProps} containerStyle={{ marginVertical: 8 }} />
        </View>
      )}
    </View>
  );
}
