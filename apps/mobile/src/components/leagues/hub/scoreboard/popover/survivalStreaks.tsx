import { useState, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Skull, ShieldCheck, Dices, MoveRight } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import Modal from '~/components/common/modal';
import { PointsIcon } from '~/components/icons/generated';
import { type EnrichedCastaway } from '~/types/castaways';
import ColorRow from '~/components/shared/colorRow';

interface SurvivalStreaksProps {
  survivalCap: number;
  currentStreak?: number;
  eliminatedEpisode?: number | null;
  shotInTheDarkStatus?: { episodeNumber: number; status: 'pending' | 'saved' | 'wasted' } | null;
  isLoggedIn?: boolean;
  selectionList?: (EnrichedCastaway | null)[];
  secondaryPickList?: (EnrichedCastaway | null)[];
}

export default function SurvivalStreaks({
  currentStreak,
  eliminatedEpisode,
  shotInTheDarkStatus,
  survivalCap,
  isLoggedIn = false,
  selectionList,
  secondaryPickList,
}: SurvivalStreaksProps) {
  const [isVisible, setIsVisible] = useState(false);

  const isPending = shotInTheDarkStatus?.status === 'pending';
  const isSaved =
    shotInTheDarkStatus?.status === 'saved' &&
    shotInTheDarkStatus.episodeNumber === eliminatedEpisode;

  const condensedTimeline = useMemo(() => (selectionList ?? [])
    .reduce((acc, castaway, index) => {
      if (castaway === null) return acc;
      const prev = acc[acc.length - 1];
      if (prev) {
        acc[acc.length - 1] = { ...prev, end: index - 1 };
      }
      if (acc[acc.length - 1]?.castaway?.fullName === castaway.fullName) {
        acc[acc.length - 1]!.end = index;
        return acc;
      }

      const start = acc.length === 0 ? 'Draft' : index;
      const isReEntry = typeof start === 'number'
        && castaway.eliminatedEpisode !== null
        && start >= castaway.eliminatedEpisode;

      let end: number | null;
      if (isReEntry && castaway.redemption?.length) {
        const relevantRedemption = [...castaway.redemption]
          .sort((a, b) => b.reentryEpisode - a.reentryEpisode)
          .find(r => typeof start === 'number' && r.reentryEpisode <= start);
        end = relevantRedemption?.secondEliminationEpisode ?? null;
      } else {
        end = castaway.eliminatedEpisode ?? null;
      }

      return [...acc, { castaway, start, end }];
    }, [] as { castaway: EnrichedCastaway, start: number | string, end: number | null }[]),
    [selectionList]);

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

          {/* Selection History */}
          {condensedTimeline.length > 0 && (
            <>
              <View className='h-px bg-primary/20' />
              <Text className='text-sm font-bold uppercase tracking-wider text-center text-foreground'>
                Selection History
              </Text>
              <View className='gap-1'>
                {condensedTimeline.map(({ castaway, start, end }, index) => (
                  <View key={index} className='flex-row items-center gap-3'>
                    <ColorRow
                      className='px-2 justify-center font-medium text-sm'
                      color={castaway.tribe?.color ?? '#AAAAAA'}>
                      {castaway.fullName}
                    </ColorRow>
                    <View className='flex-row gap-1 items-center flex-1'>
                      <Text className='font-medium text-sm text-foreground'>{start}</Text>
                      <MoveRight size={16} color={colors.foreground} />
                      <Text className='font-medium text-sm text-foreground'>
                        {end ? `${end}` : 'Present'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Secondary Pick History */}
          {!!secondaryPickList?.slice(1)?.length && (
            <>
              <View className='h-px bg-primary/20' />
              <Text className='text-sm font-semibold uppercase tracking-wide text-center text-foreground'>
                Secondaries
              </Text>
              <View className='gap-1'>
                {secondaryPickList.slice(1).map((castaway, index) => (
                  <View key={index} className='flex-row items-center gap-1'>
                    <ColorRow
                      className='px-2 justify-center font-medium text-sm'
                      color={castaway?.tribe?.color ?? '#AAAAAA'}>
                      {castaway?.fullName ?? 'No Pick'}
                    </ColorRow>
                    <View className='flex-row gap-1 items-center flex-1'>
                      <MoveRight size={16} color={colors.foreground} />
                      <Text className='font-medium text-sm text-foreground'>{index + 1}</Text>
                    </View>
                  </View>
                ))}
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
