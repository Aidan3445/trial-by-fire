import { View, Text } from 'react-native';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import { usePredictionHistory } from '~/hooks/leagues/query/usePredictionHistory';
import { useCarousel } from '~/hooks/ui/useCarousel';
import PredictionTable from '~/components/leagues/hub/activity/predictionHistory/table';
import { useEffect } from 'react';
import MemberSelector from '~/components/leagues/hub/activity/predictionHistory/memberSelector';



function StatsRow({ stats }: { stats: { count: { correct: number; total: number }; points: { earned: number; possible: number } } }) {
  return (
    <View className='flex-row justify-center gap-4'>
      <Text className='text-base text-muted-foreground'>
        Accuracy:{' '}
        <Text className='font-bold text-foreground'>
          {stats.count.correct}/{stats.count.total}
        </Text>
      </Text>
      <Text className='text-base text-muted-foreground'>
        Points:{' '}
        <Text className='font-bold text-foreground'>
          {stats.points.earned}/{stats.points.possible}
        </Text>
      </Text>
    </View>
  );
}

export default function PredictionHistory() {
  const {
    league,
    carouselData,
    stats,
    memberOptions,
    selectedMemberId,
    setSelectedMemberId,
    hasData,
    isSingleEpisode,
    keyEpisodes,
  } = usePredictionHistory();

  const { ref, props, progressProps, setCarouselData } = useCarousel(carouselData);

  const handleMemberChange = (memberId: number) => {
    setSelectedMemberId(memberId);
  };

  useEffect(() => {
    setCarouselData(carouselData);
    if (ref.current) {
      ref.current.scrollTo({ index: 0, animated: false });
    }
  }, [carouselData, ref, setCarouselData]);

  // Empty state
  if (!hasData) {
    return (
      <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2 w-full'>
        <View className='flex-row items-center gap-2 px-1'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Prediction History
          </Text>
        </View>

        <StatsRow stats={stats} />

        <MemberSelector
          memberOptions={memberOptions}
          selectedMemberId={selectedMemberId}
          onSelect={handleMemberChange} />

        <View className='rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
          <View className='bg-primary/10 py-3'>
            <Text className='text-lg font-bold uppercase tracking-wider text-foreground text-center'>
              No predictions made yet for this member.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  // Single episode
  if (isSingleEpisode && carouselData[0]) {
    const { episode, predictions } = carouselData[0];

    return (
      <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2 w-full'>
        <View className='flex-row items-center gap-2 px-1'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Prediction History
          </Text>
        </View>

        <StatsRow stats={stats} />

        <MemberSelector
          memberOptions={memberOptions}
          selectedMemberId={selectedMemberId}
          onSelect={handleMemberChange} />

        <View className='rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden'>
          <View className='bg-primary/10 py-2'>
            <Text className='text-xl font-bold uppercase tracking-wider text-foreground text-center'>
              Episode {episode}
            </Text>
          </View>
          <PredictionTable
            noCarousel
            predictions={predictions}
            previousEpisodeNumber={keyEpisodes?.previousEpisode?.episodeNumber ?? 0}
            seasonId={league!.seasonId} />
        </View>
      </View>
    );
  }

  // Multi episode carousel
  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card gap-2 pt-2 w-full'>
      <View className='flex-row items-center gap-2 px-3'>
        <View className='h-6 w-1 rounded-full bg-primary' />
        <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
          Prediction History
        </Text>
      </View>

      <MemberSelector
        memberOptions={memberOptions}
        selectedMemberId={selectedMemberId}
        onSelect={handleMemberChange} />

      <StatsRow stats={stats} />

      <Carousel
        ref={ref}
        {...props}
        height={180}
        renderItem={({ item }) => (
          <View className='flex-1 rounded-lg border-2 border-primary/20 bg-accent/50 overflow-hidden mx-2'>
            <View className='bg-primary/10 h-6'>
              <Text
                allowFontScaling={false}
                className='text-xl font-bold uppercase tracking-wider text-foreground text-center'>
                Episode {item.episode}
              </Text>
            </View>
            <PredictionTable
              predictions={item.predictions}
              previousEpisodeNumber={keyEpisodes?.previousEpisode?.episodeNumber ?? 0}
              seasonId={league!.seasonId} />
          </View>
        )}
        loop={false} />

      <View className='items-center'>
        <Pagination.Basic {...progressProps} containerStyle={{ marginBottom: 4 }} />
      </View>
    </View>
  );
}
