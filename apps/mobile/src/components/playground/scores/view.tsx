import { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useTabsCarousel } from '~/hooks/ui/useTabsCarousel';
import { cn } from '~/lib/utils';
import { PointsIcon } from '~/components/icons/generated';
import { type SeasonsDataQuery } from '~/types/seasons';
import { type BaseEventRules } from '~/types/leagues';
import { compileScores } from '~/lib/scores';
import ScoreboardBody from '~/components/home/scoreboard/body';
import SelectSeason from '~/components/home/scoreboard/selectSeason';
import ScoreChart, { type ChartSeries } from '~/components/shared/chart/view';
import { twentyFourColors } from '~/lib/colors';

const CASTAWAY_COLORS = twentyFourColors;

const TABS = ['scoreboard', 'chart'] as const;
type Tab = (typeof TABS)[number];

interface PlaygroundScoresProps {
  scoreData: SeasonsDataQuery[];
  someHidden?: boolean;
  overrideBaseRules?: BaseEventRules;
  className?: string;
}

export default function PlaygroundScores({
  scoreData,
  someHidden,
  overrideBaseRules,
  className,
}: PlaygroundScoresProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - 16;
  const [selectedSeasonIndex, setSelectedSeasonIndex] = useState(0);

  const { scrollRef, activeTab, setActiveTab, handleScroll } = useTabsCarousel<Tab>({
    tabs: TABS,
    defaultTab: 'scoreboard',
    width: contentWidth,
  });

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
        secondaryPick: null,
      } : null
    ).scores;

    const sortedCastaways = Object.entries(castawayScores)
      .sort(
        ([_, scoresA], [__, scoresB]) => (scoresB.slice().pop() ?? 0) - (scoresA.slice().pop() ?? 0)
      )
      .map(([castawayId, scores]) => [Number(castawayId), scores] as [number, number[]]);

    const castawaySplitIndex = Math.ceil(sortedCastaways.length / 2);

    return { sortedCastaways, castawaySplitIndex, data, castawayScores };
  }, [scoreData, selectedSeasonIndex, overrideBaseRules]);

  // Chart data derived from the same compiled scores
  const { chartData, chartSeries, maxEpisode } = useMemo(() => {
    if (!selectedSeasonData) return { chartData: [], chartSeries: [], maxEpisode: 1 };

    const { sortedCastaways, data } = selectedSeasonData;
    const castawayMap = new Map(
      data.castaways?.map((c) => [c.castawayId, c]) ?? []
    );

    const chartSeries: ChartSeries[] = sortedCastaways.map(([castawayId], i) => {
      const castaway = castawayMap.get(castawayId);
      const name = castaway?.fullName ?? `Castaway ${castawayId}`;
      return {
        key: name,
        label: name.split(' ')[0] ?? name,
        color: CASTAWAY_COLORS[i % CASTAWAY_COLORS.length]!,
        eliminatedEpisode: castaway?.eliminatedEpisode,
      };
    });

    let maxEpisode = 1;
    sortedCastaways.forEach(([_, scores]) => {
      scores.forEach((_, ep) => {
        if (ep >= 1) maxEpisode = Math.max(maxEpisode, ep);
      });
    });

    type ChartDataPoint = { episode: number;[key: string]: number };
    const chartData: ChartDataPoint[] = [];

    const episode0: ChartDataPoint = { episode: 0 };
    chartSeries.forEach((s) => (episode0[s.key] = 0));
    chartData.push(episode0);

    for (let ep = 1; ep <= maxEpisode; ep++) {
      const point: ChartDataPoint = { episode: ep };
      sortedCastaways.forEach(([_castawayId, scores], i) => {
        point[chartSeries[i]!.key] = scores[ep] ?? 0;
      });
      chartData.push(point);
    }

    return { chartData, chartSeries, maxEpisode };
  }, [selectedSeasonData]);

  const allZero = useMemo(() => {
    return (
      selectedSeasonData?.sortedCastaways.every(([_, scores]) => scores.every((s) => s === 0))
      ?? true
    );
  }, [selectedSeasonData]);

  const selectSeason = useCallback(
    (seasonName: string) => {
      const index = scoreData.findIndex((s) => s.season.name === seasonName);
      if (index !== -1) setSelectedSeasonIndex(index);
    },
    [scoreData]
  );

  useEffect(() => {
    if (
      (selectedSeasonIndex >= scoreData.length && scoreData.length > 0)
      || scoreData.length === 1
    ) {
      setSelectedSeasonIndex(0);
    }
  }, [scoreData, selectedSeasonIndex]);

  const renderTab = useCallback(
    (tab: Tab, label: string) => (
      <Pressable
        key={tab}
        onPress={() => setActiveTab(tab)}
        className={cn(
          'flex-1 items-center justify-center rounded-md py-2 transition-colors',
          activeTab === tab ? 'bg-primary' : 'bg-transparent'
        )}>
        <Text
          className={cn(
            'text-sm font-bold uppercase tracking-wider transition-colors',
            activeTab === tab ? 'text-white' : 'text-muted-foreground'
          )}>
          {label}
        </Text>
      </Pressable>
    ),
    [activeTab, setActiveTab]
  );

  if (!selectedSeasonData) {
    return (
      <View className='relative w-full items-center overflow-hidden rounded-xl border-2 border-primary/20 bg-card p-4'>
        <Text className='text-primary'>Loading season...</Text>
      </View>
    );
  }

  const title = selectedSeasonIndex === 0
    ? (allZero ? 'Castaways' : 'Leaderboard')
    : 'Season Standings';

  return (
    <View className={cn('relative w-full overflow-hidden rounded-xl border-2 border-primary/20 bg-card', className)}>
      {/* Header */}
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
            seasons={scoreData.map((s) => ({ value: s.season.name, label: s.season.name }))}
            value={selectedSeasonData.data.season.name}
            setValue={selectSeason}
            someHidden={someHidden} />
        )}
      </View>

      {/* Tabs */}
      <View className='flex-row rounded-lg bg-accent p-1 gap-1 mx-2'>
        {renderTab('scoreboard', 'Scoreboard')}
        {renderTab('chart', 'Chart')}
      </View>

      {/* Carousel */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        decelerationRate='fast'
        contentContainerStyle={{ width: contentWidth * TABS.length }}>
        {/* Scoreboard */}
        <View
          className='flex-1 justify-start items-center p-2'
          style={{ width: contentWidth }}>
          <View className='w-full overflow-hidden'>
            <View className='flex-row bg-white gap-0.5 px-0.5 rounded-t-md border-b-0 border-2 border-primary/20'>
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
            <ScoreboardBody
              sortedCastaways={selectedSeasonData.sortedCastaways}
              castawaySplitIndex={selectedSeasonData.castawaySplitIndex}
              data={selectedSeasonData.data}
              allZero={allZero} />
          </View>
        </View>

        {/* Chart */}
        <View
          className='justify-center items-center p-2'
          style={{ width: contentWidth }}>
          <ScoreChart
            chartData={chartData}
            series={chartSeries}
            maxEpisode={maxEpisode} />
        </View>
      </ScrollView>
    </View>
  );
}
