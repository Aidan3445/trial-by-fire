import { type ReactNode, useMemo } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { StickyScrollContext } from '~/components/shared/eventTimeline/table/stickyTable/context';

interface StickyScrollViewProps {
  children: ReactNode;
}

export default function StickyScrollView({ children }: StickyScrollViewProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const contextValue = useMemo(() => ({ scrollX }), [scrollX]);

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}>
        <StickyScrollContext.Provider value={contextValue}>
          <View className='min-w-full'>
            {children}
          </View>
        </StickyScrollContext.Provider>
      </Animated.ScrollView>
    </View>
  );
}
