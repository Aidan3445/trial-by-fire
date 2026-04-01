import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Skull, ShieldCheck, Dices } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import Modal from '~/components/common/modal';
import { PointsIcon } from '~/components/icons/generated';

interface SurvivalStreaksProps {
  survivalCap: number;
  currentStreak?: number;
  eliminatedEpisode?: number | null;
  shotInTheDarkStatus?: { episodeNumber: number; status: 'pending' | 'saved' | 'wasted' } | null;
  isLoggedIn?: boolean;
}

export default function SurvivalStreaks({
  currentStreak,
  eliminatedEpisode,
  shotInTheDarkStatus,
  survivalCap,
  isLoggedIn = false,
}: SurvivalStreaksProps) {
  const [isVisible, setIsVisible] = useState(false);

  const isPending = shotInTheDarkStatus?.status === 'pending';
  const isSaved =
    shotInTheDarkStatus?.status === 'saved' &&
    shotInTheDarkStatus.episodeNumber === eliminatedEpisode;

  const renderTriggerContent = () => {
    if (isPending) {
      return <Dices size={20} color={isLoggedIn ? colors.primary : colors.foreground} />;
    }

    if (eliminatedEpisode) {
      if (isSaved) {
        return <ShieldCheck size={20} color='#16a34a' />;
      }
      return <Skull size={18} color={colors.primary} />;
    }

    return (
      <Text
        allowFontScaling={false}
        className='text-base font-bold text-foreground'>
        {Math.min(currentStreak ?? Infinity, survivalCap)}
      </Text>
    );
  };

  return (
    <>
      <Pressable
        onPress={() => setIsVisible(true)}
        className='w-5 h-5 items-center justify-center active:opacity-70'>
        {renderTriggerContent()}
      </Pressable>

      <Modal visible={isVisible} onClose={() => setIsVisible(false)}>
        <View className='gap-3'>
          {/* Header */}
          <View className='flex-row items-center justify-center gap-1'>
            <PointsIcon size={16} color={colors.primary} />
            <Text
              allowFontScaling={false}
              className='text-base font-bold uppercase tracking-wider text-foreground'>
              Survival Streak
            </Text>
          </View>

          <View className='h-px bg-primary/20' />

          {/* Streak Info */}
          <View className='gap-1'>
            <Text
              allowFontScaling={false}
              className='text-base text-foreground'>
              Current streak: <Text className='font-bold'>{currentStreak ?? 0}</Text>
            </Text>
            <View className='flex-row items-center gap-0'>
              <Text
                allowFontScaling={false}
                className='text-base text-foreground'>
                Point cap: <Text className='font-bold'>{survivalCap}</Text>
              </Text>
              <PointsIcon allowFontScaling={false} size={12} color={colors.primary} />
            </View>
          </View>

          {/* Shot in the Dark Pending */}
          {isPending && (
            <>
              <View className='h-px bg-primary/20' />
              <View className='flex-row items-center gap-2'>
                <Dices size={16} color={colors.primary} />
                <Text className='text-base text-foreground flex-1'>
                  {isLoggedIn ? 'You have' : 'This member has'} activated{' '}
                  <Text className='font-bold'>Shot in the Dark</Text> for the upcoming episode to
                  protect their survival streak.
                </Text>
              </View>
            </>
          )}

          {/* Shot in the Dark Saved */}
          {isSaved && (
            <>
              <View className='h-px bg-primary/20' />
              <View className='flex-row items-center gap-2'>
                <ShieldCheck size={16} color='#16a34a' />
                <Text className='text-base text-positive flex-1'>
                  Shot in the Dark saved {isLoggedIn ? 'your' : 'their'} streak in episode{' '}
                  {shotInTheDarkStatus.episodeNumber}
                </Text>
              </View>
            </>
          )}

          {/* Shot in the Dark Wasted */}
          {shotInTheDarkStatus?.status === 'wasted' && (
            <>
              <View className='h-px bg-primary/20' />
              <View className='flex-row items-center gap-2'>
                <Dices size={16} color={colors.mutedForeground} />
                <Text className='text-base text-muted-foreground flex-1'>
                  Shot in the Dark was used in episode {shotInTheDarkStatus.episodeNumber} but{' '}
                  {isLoggedIn ? 'your' : 'their'} castaway wasn't eliminated.
                </Text>
              </View>
            </>
          )}

          {/* Close Button */}
          <Pressable
            onPress={() => setIsVisible(false)}
            className='rounded-lg bg-primary p-3 active:opacity-80 mt-1'>
            <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
              Got it
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
