'use client';

import React from 'react';
import { Platform, View } from 'react-native';
import LeaguesList from '~/components/leagues/grid/leaguesList';
import { cn } from '~/lib/utils';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';

export default function LeaguesScreen() {
  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh([
    ['leagues'], ['leagueMembers'], ['pendingLeagues']
  ]);

  return (
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
        <LeaguesList />
      </View>
    </SafeAreaRefreshView>
  );
}
