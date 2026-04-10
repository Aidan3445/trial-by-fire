import { type ReactNode, useRef, useMemo } from 'react';
import { View, Animated } from 'react-native';
import { StickyScrollContext } from '~/components/shared/eventTimeline/table/stickyTable/context';

interface StickyScrollViewProps {
  children: ReactNode;
}

export default function StickyScrollView({ children }: StickyScrollViewProps) {
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
        { useNativeDriver: true }
      ),
    [scrollX]
  );

  const contextValue = useMemo(() => ({ scrollX }), [scrollX]);

  return (
    <View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        bounces={false}
        alwaysBounceVertical={false}
        alwaysBounceHorizontal={false}
        onScroll={handleScroll}
        scrollEventThrottle={1}>
        <StickyScrollContext.Provider value={contextValue}>
          <View className='min-w-full'>
            {children}
          </View>
        </StickyScrollContext.Provider>
      </Animated.ScrollView>
    </View>
  );
}
