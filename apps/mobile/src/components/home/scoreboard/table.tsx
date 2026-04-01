'use client';
import { View, Text } from 'react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { type SeasonsDataQuery } from '~/types/seasons';
import { compileScores } from '~/lib/scores';
import { type BaseEventRules } from '~/types/leagues';
import ScoreboardBody from '~/components/home/scoreboard/body';
import SelectSeason from '~/components/home/scoreboard/selectSeason';
import { cn } from '~/lib/utils';
import { PointsIcon } from '~/components/icons/generated';

export interface ScoreboardTableProps {
  scoreData: SeasonsDataQuery[];
  someHidden?: boolean;
  overrideBaseRules?: BaseEventRules;
  className?: string;
}

export default function ScoreboardTable({
  scoreData,
  someHidden,
  overrideBaseRules,
  className
}: ScoreboardTableProps) {
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

  // Calculate scores only for the selected season
  const selectedSeasonData = useMemo(() => {
    const data = scoreData[selectedSeasonIndex];
    if (!data) return null;

    const { Castaway: castawayScores } = compileScores(
      data.baseEvents,
      data.eliminations,
      data.tribesTimeline,
      data.keyEpisodes,
      undefined,
      undefined,
      undefined,
      overrideBaseRules ? {
        base: overrideBaseRules,
        basePrediction: null,
        custom: [],
        shauhinMode: null,
        secondaryPick: null
      } : null
    ).scores;

    const sortedCastaways = Object.entries(castawayScores)
      .sort(
        ([_, scoresA], [__, scoresB]) => (scoresB.slice().pop() ?? 0) - (scoresA.slice().pop() ?? 0)
      )
      .map(([castawayId, scores]) => [Number(castawayId), scores] as [number, number[]]);

    const castawaySplitIndex = Math.ceil(sortedCastaways.length / 2);

    return { sortedCastaways, castawaySplitIndex, data };
  }, [scoreData, selectedSeasonIndex, overrideBaseRules]);

  // Calculate allZero based on selected season data
  const allZero = useMemo(() => {
    return (
      selectedSeasonData?.sortedCastaways.every(([_, scores]) => scores.every(score => score === 0))
      ?? true
    );
  }, [selectedSeasonData]);

  // Season selection handler
  const selectSeason = useCallback(
    (seasonName: string) => {
      const index = scoreData.findIndex(s => s.season.name === seasonName);
      if (index !== -1) {
        setSelectedSeasonIndex(index);
      }
    },
    [scoreData]
  );

  // Reset to first season if current selection is invalid
  // or if scoreData changes and there is only one season
  useEffect(() => {
    if (
      (selectedSeasonIndex >= scoreData.length && scoreData.length > 0)
      || scoreData.length === 1
    ) {
      setSelectedSeasonIndex(0);
    }
  }, [scoreData, selectedSeasonIndex]);

  if (!selectedSeasonData) {
    return (
      <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20 p-4 items-center'>
        <Text className='text-primary'>Loading season...</Text>
      </View>
    );
  }

  const title = selectedSeasonIndex === 0
    ? (allZero ? 'Castaways' : 'Leaderboard')
    : 'Season Standings';

  return (
    <View className={cn('relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20', className)}>
      {/* Section Header */}
      <View className='z-10 p-4 pb-2'>
        <View className='flex-row items-center gap-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black tracking-tight uppercase'>{title}</Text>
        </View>
        <View className='flex-row items-center gap-2 ml-2.5'>
          <Text className='text-xs font-bold text-primary uppercase tracking-wider'>
            {selectedSeasonData.data.season.name}
          </Text>
        </View>
        {scoreData.length > 1 && (
          <SelectSeason
            seasons={scoreData.map(s => ({ value: s.season.name, label: s.season.name }))}
            value={selectedSeasonData.data.season.name}
            setValue={selectSeason}
            someHidden={someHidden} />
        )}
      </View>

      {/* Scoreboard Table */}
      <View className='px-2'>
        {/* Table Header */}
        <View className='rounded-t-lg border-2 border-b-0 border-primary/20 overflow-hidden'>
          <View className='flex-row bg-white gap-0.5 px-0.5 rounded-t-md'>
            {!allZero && (
              <>
                <View className='w-11 justify-center'>
                  <Text
                    allowFontScaling={false}
                    className='text-base text-center font-bold'>
                    Place
                  </Text>
                </View>
                <View className='w-10 -ml-2 items-center justify-center'>
                  <PointsIcon size={12} color='black' />
                </View>
              </>
            )}
            <View className='flex-1 justify-center'>
              <Text
                allowFontScaling={false}
                className={cn(
                  'text-base text-left font-bold',
                  allZero && 'text-center'
                )}>
                Castaway
              </Text>
            </View>
          </View>
        </View>

        {/* Table Body */}
        <ScoreboardBody
          sortedCastaways={selectedSeasonData.sortedCastaways}
          castawaySplitIndex={selectedSeasonData.castawaySplitIndex}
          data={selectedSeasonData.data}
          allZero={allZero} />
      </View>
    </View>
  );
}
