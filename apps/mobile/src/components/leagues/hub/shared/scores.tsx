import { useCallback } from 'react';
import { View, Text, ScrollView, Pressable, useWindowDimensions } from 'react-native';
import { useTabsCarousel } from '~/hooks/ui/useTabsCarousel';
import { cn } from '~/lib/utils';
import Podium from '~/components/leagues/hub/scoreboard/podium/view';
import Scoreboard from '~/components/leagues/hub/scoreboard/view';
import Chart from '~/components/leagues/hub/chart/view';

const SCORE_TABS = ['podium', 'scoreboard', 'chart'] as const;
type ScoreTab = (typeof SCORE_TABS)[number];

interface ScoresProps {
  isActive?: boolean;
}

export default function Scores({ isActive = false }: ScoresProps) {
  const { width: screenWidth } = useWindowDimensions();
  const contentWidth = screenWidth - 16; // Account for outer padding

  const tabs = isActive ? (['scoreboard', 'chart'] as const) : SCORE_TABS;
  const defaultTab = isActive ? 'scoreboard' : 'podium';

  const { scrollRef, activeTab, setActiveTab, handleScroll } = useTabsCarousel<ScoreTab>({
    tabs,
    defaultTab,
    width: contentWidth,
  });

  const renderTab = useCallback(
    (tab: ScoreTab, label: string) => (
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

  return (
    <View className='shrink rounded-xl border-2 border-primary/20 bg-card'>
      {/* Tabs */}
      <View className='flex-row rounded-lg bg-accent p-1 gap-1 m-2'>
        {!isActive && renderTab('podium', 'Podium')}
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
        contentContainerStyle={{ width: contentWidth * tabs.length }}>
        {!isActive && (
          <View
            className='flex-1 justify-center items-center p-2 pr-1.5'
            style={{ width: contentWidth }}>
            <Podium />
          </View>
        )}
        <View
          className='flex-1 justify-start items-center p-2 pr-1.5'
          style={{ width: contentWidth }}>
          <Scoreboard className='w-full bg-primary/5 border-2 border-primary/20 rounded-lg overflow-hidden' />
        </View>
        <View
          className='justify-center items-center p-2 pr-1.5'
          style={{ width: contentWidth }}>
          <Chart />
        </View>
      </ScrollView>
    </View>
  );
}
