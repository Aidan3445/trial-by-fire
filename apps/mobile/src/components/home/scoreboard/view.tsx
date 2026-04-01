'use client';

import { View, Text } from 'react-native';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import ScoreboardTable from '~/components/home/scoreboard/table';

export function CastawayScoreboard() {
  const { data: scoreData, isLoading, error } = useSeasonsData(true);

  if (isLoading) {
    return (
      <View className='relative overflow-hidden rounded-xl bg-card border-2 border-primary/20'>
        <Text className='text-center text-muted-foreground'>Loading...</Text>
      </View>
    );
  }

  if (error || !scoreData || scoreData.length === 0) {
    return (
      <View className='relative overflow-hidden rounded-xl bg-card border-2 border-primary/20'>
        <Text className='text-center text-muted-foreground'>
          No active leagues with scoring data.
        </Text>
      </View>
    );
  }

  const mostRecent6 = scoreData
    .filter(s => s.tribes.length > 0)
    .sort((a, b) => b.season.premiereDate.getTime() - a.season.premiereDate.getTime());

  return (
    <ScoreboardTable
      className='relative overflow-hidden rounded-xl bg-card border-2 border-primary/20'
      scoreData={mostRecent6}
      someHidden={scoreData.length > 6} />
  );
}
