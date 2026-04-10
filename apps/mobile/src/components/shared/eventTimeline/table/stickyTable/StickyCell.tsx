import { type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useStickyScroll } from '~/components/shared/eventTimeline/table/stickyTable/context';

interface StickyCellProps {
  children: ReactNode;
  className?: string;
  zIndex?: number;
}

/**
 * Wraps content to stay fixed on the left during horizontal scroll.
 *
 * Renders two copies of `children`:
 * 1. An invisible in-flow copy that determines the row height
 * 2. An absolutely-positioned overlay that translates with scrollX
 *
 * Place this as the first child inside a flex-row View.
 */
export default function StickyCell({
  children,
  className,
  zIndex = 5,
}: StickyCellProps) {
  const { scrollX } = useStickyScroll();

  const stickyStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: scrollX.value }],
  }));

  return (
    <>
      {/* Absolute overlay — stays fixed during horizontal scroll */}
      <Animated.View
        style={[
          {
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex,
            display: 'flex',
          },
          stickyStyle,
        ]}
        className={className}>
        {children}
      </Animated.View>

      {/* In-flow ghost — invisible, determines row height */}
      <View style={{ opacity: 0 }} pointerEvents='none'>
        {children}
      </View>
    </>
  );
}
