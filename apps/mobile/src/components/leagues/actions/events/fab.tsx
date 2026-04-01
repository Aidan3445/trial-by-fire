import { useRouter } from 'expo-router';
import { Pencil } from 'lucide-react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Platform, Text, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Fragment, useCallback } from 'react';
import { colors } from '~/lib/colors';
const FAB_SIZE = 56;
const MARGINS = {
  x: 8,
  top: Platform.OS === 'ios' ? -35 : 8,
  bottom: Platform.OS === 'ios' ? 110 : 85,
};
interface EventFABProps {
  hash: string;
  isLeagueAdmin: boolean;
  isSysAdmin: boolean;
  isActive: boolean;
}
export default function EventFAB({ hash, isLeagueAdmin, isSysAdmin, isActive }: EventFABProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const minX = MARGINS.x;
  const maxX = width - FAB_SIZE - MARGINS.x;
  const minY = insets.top + MARGINS.top;
  const maxY = height - FAB_SIZE - insets.bottom - MARGINS.bottom;
  const translateX = useSharedValue(maxX);
  const translateY = useSharedValue(maxY);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const isPressed = useSharedValue(false);
  const snapToCorner = () => {
    'worklet';
    const midX = width / 2;
    const fabCenterX = translateX.value + FAB_SIZE / 2;
    translateX.value = withSpring(fabCenterX < midX ? minX : maxX, { damping: 100 });
    const midY = (minY + maxY) / 2;
    const fabCenterY = translateY.value;
    translateY.value = withSpring(
      fabCenterY < midY ? minY : maxY,
      { damping: 100 }
    );
  };
  const gesture = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      isDragging.value = true;
    })
    .onUpdate((event) => {
      translateX.value = Math.max(minX, Math.min(maxX, contextX.value + event.translationX));
      translateY.value = Math.max(minY, Math.min(maxY, contextY.value + event.translationY));
    })
    .onEnd(() => {
      isDragging.value = false;
      isPressed.value = false;
      snapToCorner();
    });
  const navigate = useCallback(() => {
    if (isSysAdmin) {
      router.push(`/sysAdmin?hash=${hash}`);
    } else if (isLeagueAdmin) {
      router.push(`/customEvent?hash=${hash}`);
    }
  }, [router, hash, isSysAdmin, isLeagueAdmin]);
  const tap = Gesture
    .Tap()
    .runOnJS(true)
    .onBegin(() => {
      isPressed.value = true;
    })
    .onEnd(navigate)
    .onFinalize(() => {
      isPressed.value = false;
    });
  const composed = Gesture.Exclusive(gesture, tap);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isDragging.value ? 1.1 : 1) },
    ],
    opacity: isDragging.value
      ? withSpring(0.8)
      : isPressed.value
        ? withTiming(0.8, { duration: 50 })
        : withSpring(1),
  }));
  const animatedSectionStyle = useAnimatedStyle(() => ({
    opacity: withSpring(isDragging.value ? 1 : 0),
  }));

  if (!isActive || (!isLeagueAdmin && !isSysAdmin)) return null;

  return (
    <Fragment>
      <Animated.View
        pointerEvents='none'
        className='absolute bottom-0 left-0 right-0 top-0'
        style={[animatedSectionStyle]}>
        <View className='w-full h-0 border-t border-primary border-dashed absolute top-1/2' />
        <View className='h-full w-0 border-l border-primary border-dashed absolute left-1/2' />
        <Text className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary font-black tracking-wide bg-background p-1 rounded-lg'>
          SNAP TO CORNER
        </Text>
      </Animated.View>
      <GestureDetector gesture={composed}>
        <Animated.View
          className='absolute h-14 w-14 items-center justify-center rounded-full bg-primary/90 border-2 border-accent/50 shadow-lg'
          style={[{ top: 0, left: 0 }, animatedStyle]}>
          <Pencil size={28} color={colors.card} />
        </Animated.View>
      </GestureDetector>
    </Fragment>
  );
}
