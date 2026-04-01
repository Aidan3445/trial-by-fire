import { useRouter } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';
import { useMemo, useState } from 'react';
import BaseEventHeader from '~/components/leagues/actions/events/base/header/view';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import CreateBaseEvent from '~/components/leagues/actions/events/base/create';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '~/lib/utils';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';

export default function BaseEventScreen() {
  const { data: userId, isLoading, isError } = useSysAdmin();
  const router = useRouter();

  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const { data: scoreData } = useSeasonsData(true);

  const selectedSeasonData = useMemo(() => {
    if (!scoreData) return null;
    const selected = scoreData.find(season => season.season.name === selectedSeason);
    if (selected) return selected;
    if (scoreData.length > 0) {
      setSelectedSeason(scoreData[0]!.season.name);
      return scoreData[0];
    }
    return null;
  }, [scoreData, selectedSeason]);

  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh(
    [['seasons', undefined, true], ['episodes', selectedSeasonData?.season.seasonId]]
  );

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background pt-16 justify-center items-center'>
        <BaseEventHeader
          seasons={scoreData ?? []}
          value={selectedSeason}
          setValue={setSelectedSeason} />
        <Text className='text-lg text-center'>Checking Sys Admin Status...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !userId) {
    router.dismiss();
    return null;
  }

  return (
    <SafeAreaRefreshView
      className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
      header={
        <BaseEventHeader
          seasons={scoreData ?? []}
          value={selectedSeason}
          setValue={setSelectedSeason} />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View className={cn('page justify-start gap-y-4 px-1.5 pb-12',
        Platform.OS === 'ios' && 'pt-12')}>
        <CreateBaseEvent seasonId={selectedSeasonData?.season.seasonId ?? null} />
      </View>
    </SafeAreaRefreshView>
  );
}
