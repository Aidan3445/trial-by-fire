import { useRef, useState, useCallback, useMemo } from 'react';
import { Dimensions, type LayoutChangeEvent } from 'react-native';
import { type LegacyPanGesture, type PanGesture } from 'react-native-gesture-handler';
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { type ICarouselInstance } from 'react-native-reanimated-carousel';
import { colors } from '~/lib/colors';

const PAGE_WIDTH = Dimensions.get('window').width;
const PAGE_HEIGHT = Dimensions.get('window').height;

/**
 * @param liveProgress Mirror the fractional scroll progress into React state every frame.
 * Turn it off for carousels with heavy slides and read `index` instead, which only changes on a new slide.
 */
export function useCarousel<T>(initialData: T[] = [], { liveProgress = true }: { liveProgress?: boolean } = {}) {
  const [carouselData, setCarouselDataState] = useState<T[]>(initialData);
  const ref = useRef<ICarouselInstance>(null);
  const progress = useSharedValue<number>(0);
  const [progressState, setProgressState] = useState(0);
  const [index, setIndex] = useState(0);

  const [containerWidth, setContainerWidth] = useState(PAGE_WIDTH);
  const [containerHeight, setContainerHeight] = useState(PAGE_HEIGHT);

  const onLayout = useCallback((e: LayoutChangeEvent) => {
    const { width } = e.nativeEvent.layout;
    if (width > 0) setContainerWidth(width);

    const { height } = e.nativeEvent.layout;
    if (height > 0) setContainerHeight(height);
  }, []);

  useAnimatedReaction(() => progress.value,
    (value) => {
      // Update the progress state on the JS thread
      if (liveProgress) scheduleOnRN(setProgressState, value);
    });

  // Nearest slide; flips halfway through a swipe and only crosses to JS when it changes
  useAnimatedReaction(() => Math.round(progress.value),
    (value, previous) => {
      if (value !== previous) scheduleOnRN(setIndex, value);
    });

  const setCarouselData = useCallback((newData: T[]) => {
    setCarouselDataState(newData);
  }, [setCarouselDataState]);

  const onPressPagination = useCallback((target: number) => {
    ref.current?.scrollTo({ index: target, animated: true });
  },
    []
  );

  const scrollNext = useCallback(() => {
    ref.current?.scrollTo({
      count: 1,
      animated: true,
    });
  }, []);

  const props = useMemo(() => ({
    data: carouselData,
    progress,
    onProgressChange: progress,
    width: PAGE_WIDTH - 15,
    loop: carouselData.length > 2,
    enabled: carouselData.length > 1,
    // Carousel 4 types this with RNGH 3's PanGesture, but still passes the legacy Gesture.Pan() builder
    onConfigurePanGesture: (gesture: PanGesture) => {
      (gesture as unknown as LegacyPanGesture).activeOffsetX([-10, 10]);
    },
  }), [carouselData, progress]);

  const progressProps = useMemo(() => ({
    dotStyle: { backgroundColor: colors.secondary, borderRadius: 50, margin: 3 },
    activeDotStyle: { backgroundColor: colors.primary, borderRadius: 50 },
    onPress: onPressPagination,
    ...props
  }), [onPressPagination, props]);

  return {
    setCarouselData,
    ref,
    progress: progressState,
    index,
    onPressPagination,
    PAGE_WIDTH,
    PAGE_HEIGHT,
    container: { width: containerWidth, height: containerHeight, onLayout },
    props,
    progressProps,
    scrollNext,
  };
}
