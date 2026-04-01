import { type ReactNode, useState } from 'react';
import { Keyboard, type LayoutChangeEvent, Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import Logo from '~/components/shared/logo';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';

interface AuthCardProps {
  children: ReactNode;
}

export default function AuthCard({ children }: AuthCardProps) {
  const headerHeight = useHeaderHeight();
  const [cardY, setCardY] = useState(0);
  const translateY = useSharedValue(0);

  // Target: card top should not go above safe area top + small padding
  const minY = 85;

  useKeyboardHandler({
    onMove: (e) => {
      'worklet';
      if (e.height > 0) {
        // Move up by keyboard height, but don't go above minY
        const maxShift = cardY - minY;
        const shift = Math.min(e.height, maxShift);
        translateY.value = -shift;
      } else {
        translateY.value = withTiming(0, { duration: 250 });
      }
    },
  }, [cardY, minY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const onCardLayout = (e: LayoutChangeEvent) => {
    e.target.measureInWindow((_x, y) => {
      setCardY(y);
    });
  };

  return (
    <SafeAreaView className='relative flex-1 bg-background'>
      <Pressable
        className='flex-1'
        onPress={Keyboard.dismiss}>
        <View
          className='absolute w-full items-center'
          style={{ top: headerHeight }}>
          <Logo />
        </View>

        <Animated.View
          style={[{ flex: 1, justifyContent: 'flex-end', paddingHorizontal: 24 }, animatedStyle]}>
          <View className='rounded-3xl bg-white p-8 border-2 border-primary/20 mb-2'>
            <View onLayout={onCardLayout}>
              {children}
            </View>
          </View>
        </Animated.View>
      </Pressable>
    </SafeAreaView>
  );
}
