import React, { useMemo, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import PlaygroundHeader from '~/components/playground/header/view';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { useBaseEventRules } from '~/hooks/leagues/mutation/useBaseEventRules';
import ChallengeScoreSettings from '~/components/leagues/customization/events/base/challenges';
import AdvantageScoreSettings from '~/components/leagues/customization/events/base/advantages';
import OtherScoreSettings from '~/components/leagues/customization/events/base/other';
import { BaseEventRulesZod } from '~/types/leagues';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import PlaygroundScores from '~/components/playground/scores/view';

export default function PlaygroundScreen() {
  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh([['seasons']]);
  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const { data: scoreData } = useSeasonsData(true);
  const { reactForm } = useBaseEventRules();

  const selectedSeasonData = useMemo(() => {
    if (!scoreData) return null;
    const selected = scoreData.find(season => season.season.name === selectedSeason);
    if (selected) return selected;
    // defaulting to second most recent season for now
    // no events in most recent season usually
    if (scoreData.length > 1) {
      setSelectedSeason(scoreData[1]!.season.name);
      return scoreData[1];
    }
    return null;
  }, [scoreData, selectedSeason]);

  return (
    <SafeAreaRefreshView
      header={
        <PlaygroundHeader
          seasons={scoreData ?? []}
          value={selectedSeason}
          setValue={setSelectedSeason} />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View
        className={cn(
          'page justify-start gap-y-4 px-1.5 pt-8 pb-1.5',
          refreshing && Platform.OS === 'ios' && 'pt-12'
        )}>
        {/* Scoring Settings Card */}
        <View className='w-full rounded-lg border-2 border-primary/20 bg-card p-4 shadow-lg shadow-primary/10'>
          {/* Description */}
          <View className='mb-4'>
            <Text className='text-center font-medium text-muted-foreground'>
              Test out different scoring configurations and see how they impact the
              castaway scores!
            </Text>
          </View>

          {/* Settings Accordions */}
          <View className='gap-2'>
            <ChallengeScoreSettings reactForm={reactForm} hidePrediction />
            <AdvantageScoreSettings reactForm={reactForm} hidePrediction />
            <OtherScoreSettings reactForm={reactForm} hidePrediction />
          </View>

          {/* Reset Button */}
          <Button
            className='mt-4 flex-row items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-transparent p-3 active:bg-primary/10'
            onPress={() => reactForm.reset()}>
            <RotateCcw size={16} color={colors.primary} />
            <Text className='text-xs font-bold uppercase tracking-wider text-primary'>
              Reset Scoring
            </Text>
          </Button>
        </View>

        {/* Scoreboard */}
        {selectedSeasonData ? (
          <PlaygroundScores
            scoreData={[selectedSeasonData]}
            overrideBaseRules={BaseEventRulesZod.parse(reactForm.watch('baseEventRules'))} />
        ) : (
          <View className='relative w-full items-center overflow-hidden rounded-xl border-2 border-primary/20 bg-card p-4'>
            <Text className='text-primary'>Loading season...</Text>
          </View>
        )}
      </View>
    </SafeAreaRefreshView>
  );
}
