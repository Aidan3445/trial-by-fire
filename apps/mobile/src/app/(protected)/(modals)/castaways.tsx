'use client';

import { Platform, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';
import CastawaysView from '~/components/seasons/castaways/view';
import { useSelectionTimeline } from '~/hooks/leagues/query/useSelectionTimeline';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import DraftCastawaysHeader from '~/components/leagues/draft/header/castawaysHeader';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import { cn } from '~/lib/utils';

export default function DraftCastawaysScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: league } = useLeague(hash);
  const { data: selectionTimeline } = useSelectionTimeline(hash);
  const { data: leagueMembers } = useLeagueMembers(hash);
  const { data: seasonData } = useSeasonsData(false, league?.seasonId);
  const { refreshing, onRefresh, scrollY, handleScroll } = useLeagueRefresh();
  const router = useRouter();

  if (!league) return router.dismiss();

  const leagueData = {
    selectionTimeline,
    leagueMembers
  };

  return (
    <SafeAreaRefreshView
      className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
      header={<DraftCastawaysHeader />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View className={cn('page justify-start gap-y-4 px-1.5 pb-12',
        Platform.OS === 'ios' && 'pt-12')}>
        {seasonData?.[0] && (
          <CastawaysView seasonData={seasonData[0]} leagueData={leagueData} />
        )}
      </View>
    </SafeAreaRefreshView>
  );
}
