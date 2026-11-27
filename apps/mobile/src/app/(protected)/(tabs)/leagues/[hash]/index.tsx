'use client';

import { DeviceEventEmitter, Platform, View } from 'react-native';
import { type KeyboardAwareScrollViewRef } from 'react-native-keyboard-controller';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';
import { cn } from '~/lib/utils';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';
import EventFAB from '~/components/leagues/actions/events/fab';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import Scores from '~/components/leagues/hub/shared/scores';
import ChangeCastaway from '~/components/leagues/hub/picks/changeCastaway';
import PredictionHistory from '~/components/leagues/hub/activity/predictionHistory/view';
import MakePredictions from '~/components/leagues/actions/events/predictions/view';
import LeagueTimeline from '~/components/leagues/hub/activity/timeline/view';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import { Fragment, useEffect, useMemo, useRef } from 'react';
import { FOCUS_SECONDARY_PICK_EVENT } from '~/hooks/leagues/mutation/useSecondaryPick';
import NeverDrafted from '~/components/leagues/hub/neverDrafted/view';
import CloneRequest from '~/components/leagues/hub/cloneRequest/view';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { customEventsOpen } from '~/lib/leagues';

export default function LeagueHubScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { refreshing, onRefresh, scrollY, handleScroll, league } = useLeagueRefresh();
  const { data: leagueMembers } = useLeagueMembers(hash);
  const { data: userId } = useSysAdmin();
  const { data: seasons } = useSeasons(true);
  const { data: seasonsData } = useSeasonsData(true, league?.seasonId);

  const neverDrafted = league?.status === 'Inactive' && !!league.neverDrafted;
  // Custom events stay open a little while after the finale
  const finaleDate = useMemo(() => {
    const seasonId = league?.seasonId;
    return seasonsData?.find((s) => s.season.seasonId === seasonId)?.season.finaleDate
      ?? seasons?.find((s) => s.seasonId === seasonId)?.finaleDate;
  }, [seasonsData, seasons, league?.seasonId]);
  const customOpen = !!league && customEventsOpen(league.status, finaleDate, league.neverDrafted);

  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const picksY = useRef(0);
  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(FOCUS_SECONDARY_PICK_EVENT, () => {
      scrollRef.current?.scrollTo({ y: Math.max(0, picksY.current - 16), animated: true });
    });
    return () => subscription.remove();
  }, []);

  return (
    <Fragment>
      <SafeAreaRefreshView
        alreadySafe
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollY={scrollY}
        handleScroll={handleScroll}
        scrollRef={scrollRef}>
        <View
          className={cn(
            'page justify-start gap-y-4 px-1.5 pt-8 pb-1.5',
            refreshing && Platform.OS === 'ios' && 'pt-12'
          )}>
          {neverDrafted ? <NeverDrafted /> : (
            <>
              <Scores isActive={league?.status === 'Active'} />
              <CloneRequest />
              <View onLayout={(e) => { picksY.current = e.nativeEvent.layout.y; }}>
                <MakePredictions />
              </View>
              <ChangeCastaway />
              <PredictionHistory />
              <LeagueTimeline />
            </>
          )}
        </View>
      </SafeAreaRefreshView>
      <EventFAB
        hash={hash}
        isLeagueAdmin={leagueMembers?.loggedIn?.role !== 'Member'}
        isSysAdmin={!!userId}
        leagueStatus={league?.status}
        customEventsOpen={customOpen} />
    </Fragment>
  );
}
