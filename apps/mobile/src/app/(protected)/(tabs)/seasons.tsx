import React, { useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { cn } from '~/lib/utils';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import SeasonsHeader from '~/components/seasons/header/view';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { Tabs, TabsContent } from '~/components/common/tabs';
import EventTimeline from '~/components/shared/eventTimeline/view';
import CastawaysView from '~/components/seasons/castaways/view';
import TribesTimeline from '~/components/seasons/tribes/view';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';

export default function SeasonsScreen() {
  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh([['seasons']]);
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

  return (
    <Tabs defaultValue='events' className='flex-1 relative bg-red-500'>
      <SafeAreaRefreshView
        className={cn(Platform.OS === 'android' && 'pt-10')}
        extraHeight={51}
        header={
          <SeasonsHeader
            seasons={scoreData ?? []}
            value={selectedSeason}
            setValue={setSelectedSeason} />
        }
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollY={scrollY}
        handleScroll={handleScroll}>
        <View className={cn(
          'page justify-start gap-y-4 px-1.5 pb-1.5',
          Platform.OS === 'ios' ? 'pt-18' : 'pt-8',
          refreshing && Platform.OS === 'ios' && 'pt-22'
        )}>
          <TabsContent value='events'>
            <EventTimeline seasonData={selectedSeasonData} hideMemberFilter />
          </TabsContent>
          <TabsContent value='castaways'>
            <CastawaysView seasonData={selectedSeasonData} />
          </TabsContent>
          <TabsContent value='tribes'>
            <TribesTimeline seasonData={selectedSeasonData} />
          </TabsContent>
        </View>
      </SafeAreaRefreshView>
    </Tabs>
  );
}
