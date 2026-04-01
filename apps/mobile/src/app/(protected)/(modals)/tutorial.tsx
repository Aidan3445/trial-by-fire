import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Carousel, { Pagination } from 'react-native-reanimated-carousel';
import Button from '~/components/common/button';
import { useCarousel } from '~/hooks/ui/useCarousel';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { ArrowLeft } from 'lucide-react-native';
import { useCallback } from 'react';
import Slide, { type SlideConfig } from '~/components/tutorial/slides/slide';
import TutorialHeader from '~/components/tutorial/header/view';
import { welcomeSlide } from '~/components/tutorial/slides/welcome';
import { draftSlide } from '~/components/tutorial/slides/draft';
import { streakSlide } from '~/components/tutorial/slides/streak';
import { predictionsSlide } from '~/components/tutorial/slides/predictions';
import { betsSlide } from '~/components/tutorial/slides/bets';
import { secondarySlide } from '~/components/tutorial/slides/secondary';
import { shotInTheDarkSlide } from '~/components/tutorial/slides/shotInTheDark';
import { switchPickSlide } from '~/components/tutorial/slides/switchPick';
import { readySlide } from '~/components/tutorial/slides/ready';
import { livePredictionsSlide } from '~/components/tutorial/slides/livePredictions';

const SLIDES: SlideConfig[] = [
  welcomeSlide,
  draftSlide,
  streakSlide,
  predictionsSlide,
  betsSlide,
  secondarySlide,
  shotInTheDarkSlide,
  switchPickSlide,
  livePredictionsSlide,
  readySlide,
];

export default function TutorialScreen() {
  const { showCustomization } = useLocalSearchParams<{ showCustomization?: string }>();
  const router = useRouter();
  const { props, progressProps, container: { width, onLayout }, ref } = useCarousel<SlideConfig>(SLIDES);

  const goNext = useCallback(() => {
    ref.current?.next();
  }, [ref]);

  const goBack = useCallback(() => {
    ref.current?.prev();
  }, [ref]);

  return (
    <SafeAreaView className='flex-1 bg-background'>
      <TutorialHeader />

      <View className='flex-1 pt-16' onLayout={onLayout}>
        <Carousel
          ref={ref}
          {...props}
          width={width}
          enabled={false}
          renderItem={({ item, index }) => {
            const isFirst = index === 0;

            return (
              <View className='flex-1'>
                <Slide slide={item} showCustomization={showCustomization !== 'false'} />

                {/* Navigation */}
                <View className='flex-row items-center justify-center gap-4 px-6 pb-4'>
                  {!isFirst && (
                    <Button
                      onPress={goBack}
                      className='h-12 w-12 items-center justify-center rounded-full border-2 border-primary/30 bg-card active:bg-primary/10'>
                      <ArrowLeft size={20} color={colors.primary} />
                    </Button>
                  )}

                  <Button
                    onPress={() => {
                      if (item.cta) {
                        router.back();
                      } else {
                        goNext();
                      }
                    }}
                    className={cn(
                      'rounded-lg bg-primary py-3 active:opacity-80 w-1/2',
                      !isFirst && 'mr-16'
                    )}>
                    <Text className='text-center text-base font-bold text-white'>
                      {item.cta ? 'Go!' : 'Next'}
                    </Text>
                  </Button>
                </View>
              </View>
            );
          }} />
      </View>

      {/* Pagination */}
      <Pagination.Basic {...progressProps} />
    </SafeAreaView>
  );
}
