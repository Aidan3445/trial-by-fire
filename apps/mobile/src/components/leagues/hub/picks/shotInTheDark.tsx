import { useEffect } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Dices, ShieldCheck } from 'lucide-react-native';
import { useShotInTheDark } from '~/hooks/leagues/mutation/useShotInTheDark';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import Modal from '~/components/common/modal';

interface ShotInTheDarkProps {
  className?: string;
}

export default function ShotInTheDark({ className }: ShotInTheDarkProps) {
  const {
    uiState,
    isSubmitting,
    showConfirmation,
    setShowConfirmation,
    showAnimation,
    handlePlay,
    handleCancel,
  } = useShotInTheDark();

  // Pulse animation for the protection screen
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (showAnimation) {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulse.value = 1;
    }
  }, [showAnimation, pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (uiState === 'hidden') return null;

  // Already used this season
  if (uiState === 'used') {
    return (
      <View
        className={cn(
          'rounded-lg border-2 border-primary/20 bg-primary/5 p-4 opacity-50',
          className
        )}>
        <View className='flex-row items-center gap-2 mb-2'>
          <ShieldCheck size={20} color={colors.mutedForeground} />
          <Text className='font-bold text-muted-foreground'>Shot in the Dark</Text>
        </View>
        <Text className='text-base text-muted-foreground'>
          Shot in the Dark has been used this season
        </Text>
      </View>
    );
  }

  return (
    <>
      <View
        className={cn(
          'rounded-lg border-2 border-primary bg-primary/5 p-4',
          className
        )}>
        <View className='flex-row items-center gap-2 mb-2'>
          <Dices size={20} color={colors.primary} />
          <Text className='font-bold text-foreground'>Shot in the Dark</Text>
        </View>

        {uiState === 'available' && (
          <>
            <Text className='text-base text-foreground mb-4'>
              You still have your <Text className='font-bold'>Shot in the Dark</Text> this season.
              Play it to protect your streak if your{' '}
              <Text className='font-bold'>survivor</Text> is eliminated this episode.
            </Text>

            <Pressable
              onPress={() => setShowConfirmation(true)}
              disabled={isSubmitting}
              className={cn(
                'flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3 active:opacity-80',
                isSubmitting && 'opacity-50'
              )}>
              <Dices size={18} color='white' />
              <Text className='text-base font-bold uppercase tracking-wider text-white'>
                Play Protection
              </Text>
            </Pressable>
          </>
        )}

        {uiState === 'pending' && (
          <View className='gap-3'>
            <Text className='text-base font-bold text-positive'>
              ✓ Shot in the Dark is active for the next episode
            </Text>
            <Text className='text-sm text-muted-foreground'>
              Your streak will be protected if your castaway is eliminated.
            </Text>
            <Pressable
              onPress={() => {
                void handleCancel();
              }}
              disabled={isSubmitting}
              className={cn(
                'rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80',
                isSubmitting && 'opacity-50'
              )}>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-foreground'>
                {isSubmitting ? 'Canceling...' : 'Cancel Protection'}
              </Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmation} onClose={() => setShowConfirmation(false)}>
        <View className='gap-4'>
          <Text className='text-xl font-black uppercase tracking-tight text-foreground text-center'>
            Play Shot in the Dark?
          </Text>
          <Text className='text-base text-muted-foreground'>
            This will protect your survival streak if your castaway is eliminated in the next
            episode.
          </Text>
          <Text className='text-base font-semibold text-destructive'>
            This is a one-time use and cannot be undone once the episode starts airing!
          </Text>
          <View className='flex-row gap-2 pt-2'>
            <Pressable
              onPress={() => setShowConfirmation(false)}
              disabled={isSubmitting}
              className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-foreground'>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                void handlePlay();
              }}
              disabled={isSubmitting}
              className={cn(
                'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
                isSubmitting && 'opacity-50'
              )}>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
                Confirm
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Protection Animation Overlay */}
      {showAnimation && (
        <View className='absolute inset-0 z-50 items-center justify-center bg-black/80'>
          <Animated.View entering={FadeIn.duration(500).springify()}>
            <Animated.View entering={ZoomIn.duration(500)} style={pulseStyle} className='items-center gap-4'>
              <ShieldCheck size={96} color='#22c55e' />
              <Text className='text-4xl font-black text-white'>PROTECTED</Text>
              <Text className='text-lg text-white/80'>Your streak is safe</Text>
            </Animated.View>
          </Animated.View>
        </View>
      )}
    </>
  );
}
