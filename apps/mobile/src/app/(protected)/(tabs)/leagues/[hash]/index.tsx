'use client';

import { Platform, View } from 'react-native';
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
import { Fragment } from 'react';

export default function LeagueHubScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { refreshing, onRefresh, scrollY, handleScroll, league } = useLeagueRefresh();
  const { data: leagueMembers } = useLeagueMembers(hash);
  const { data: userId } = useSysAdmin();

  return (
    <Fragment>
      <SafeAreaRefreshView
        alreadySafe
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollY={scrollY}
        handleScroll={handleScroll}>
        <View
          className={cn(
            'page justify-start gap-y-4 px-1.5 pt-8 pb-1.5',
            refreshing && Platform.OS === 'ios' && 'pt-12'
          )}>
          <Scores isActive={league?.status === 'Active'} />
          <MakePredictions />
          <ChangeCastaway />
          <PredictionHistory />
          <LeagueTimeline />
        </View>
      </SafeAreaRefreshView>
      <EventFAB
        hash={hash}
        isLeagueAdmin={leagueMembers?.loggedIn?.role !== 'Member'}
        isSysAdmin={!!userId}
        isActive={league?.status === 'Active'} />
    </Fragment>
  );
}
