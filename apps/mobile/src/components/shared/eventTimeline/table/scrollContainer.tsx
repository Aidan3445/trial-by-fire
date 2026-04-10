import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  type SharedValue,
} from 'react-native-reanimated';

interface ScrollContainerProps {
  children: (_scrollX: SharedValue<number>) => ReactNode;
}

export default function EpisodeScrollContainer({ children }: ScrollContainerProps) {
  const scrollX = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

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
        <View className='min-w-full'>
          {children(scrollX)}
        </View>
      </Animated.ScrollView>
    </View>
  );
}
