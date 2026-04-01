'use client';

import React from 'react';
import { View } from 'react-native';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import ActiveLeagues from '~/components/home/activeleagues/view';
import LogoLive from '~/components/home/header/logoLive';
import HomeHeader from '~/components/home/header/view';
import QuickActions from '~/components/home/quickActions/view';
import { CastawayScoreboard } from '~/components/home/scoreboard/view';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import { cn } from '~/lib/utils';

export default function Page() {
  const { refreshing, onRefresh, handleScroll, scrollY } = useRefresh([[]]);

  return (
    <SafeAreaRefreshView
      header={<HomeHeader />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View
        className={cn('justify-start gap-y-4 px-1.5 pt-8 pb-1.5')}>
        <LogoLive />
        <ActiveLeagues />
        <QuickActions className='rounded-xl border-2 border-primary/20 bg-card opacity-80' />
        <CastawayScoreboard />
      </View>
    </SafeAreaRefreshView>
  );
}
