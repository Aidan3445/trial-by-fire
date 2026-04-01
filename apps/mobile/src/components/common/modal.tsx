/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, type ReactNode } from 'react';
import { Pressable, Modal as RNModal, useWindowDimensions, View } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { cn } from '~/lib/utils';

const DISMISS_THRESHOLD = 120;
const BACKDROP_MAX_OPACITY = 0.5;

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  className?: string;
  children: ReactNode;
  swipeToDismiss?: boolean;
}

export default function Modal({
  visible: isVisible,
  onClose,
  className,
  children,
  swipeToDismiss = true,
}: ModalProps) {
  const { height } = useWindowDimensions();
  const translateY = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      translateY.value = 0;
    }
  }, [isVisible]);

  const dismiss = () => {
    'worklet';
    translateY.value = withTiming(height, { duration: 220 }, (finished) => {
      if (finished) {
        scheduleOnRN(onClose);
      }
    });
  };

  const handlePanGesture = Gesture.Pan()
    .enabled(swipeToDismiss)
    .onUpdate((e) => {
      if (e.translationY > 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.velocityY > 800 || translateY.value > DISMISS_THRESHOLD) {
        dismiss();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateY.value,
      [0, height * 0.7],
      [BACKDROP_MAX_OPACITY, 0],
      'clamp'
    ),
  }));

  useEffect(() => {
    if (isVisible) {
      translateY.value = height;
      translateY.value = withSpring(0, {
        damping: 120,
        stiffness: 2000,
      });
    }
  }, [isVisible]);

  return (
    <RNModal visible={isVisible} transparent animationType='none' onRequestClose={onClose}>
      <SafeAreaView
        edges={{ top: 'maximum', bottom: 'off' }}
        className='flex-1 px-2 justify-center'>
        {/* Backdrop */}
        <Pressable className='absolute inset-0' onPress={dismiss}>
          <Animated.View
            style={[{ position: 'absolute', inset: 0, backgroundColor: 'black' }, backdropStyle]} />
        </Pressable>

        <KeyboardAwareScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps='handled'
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          automaticallyAdjustKeyboardInsets>
          <Pressable
            style={{ flex: 1, justifyContent: 'center' }}
            onPress={dismiss}>
            <Animated.View style={modalStyle}>
              <Pressable
                className={cn(
                  'w-full rounded-xl border-2 border-primary/20 bg-card overflow-hidden',
                  className
                )}
                onPress={(e) => e.stopPropagation()}>
                {/* Drag handle — always captures pan gesture */}
                <GestureDetector gesture={handlePanGesture}>
                  <Animated.View className='items-center py-2'>
                    <View className='w-10 h-1 rounded-full bg-muted-foreground/40' />
                  </Animated.View>
                </GestureDetector>

                <View className='px-4 pb-4'>
                  {children}
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </RNModal>
  );
}
