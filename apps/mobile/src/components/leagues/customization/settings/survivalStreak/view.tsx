import { Lock, LockOpen } from 'lucide-react-native';
import { Text, View, Switch } from 'react-native';
import Button from '~/components/common/button';
import Slider from '@react-native-community/slider';
import { useSurvivalStreak } from '~/hooks/leagues/mutation/useSurvivalStreak';
import { MAX_SEASON_LENGTH } from '~/lib/leagues';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { Controller } from 'react-hook-form';
import { PointsIcon } from '~/components/icons/generated';

export default function SurvivalStreaks() {
  const {
    reactForm,
    locked,
    setLocked,
    settingsChanged,
    handleSubmit,
    resetSettings,
    disabled
  } = useSurvivalStreak();

  const displaySurvivalCap = (value: number) => {
    if (value === 0) return 'Off';
    if (value === MAX_SEASON_LENGTH) return 'Unlimited';
    return value.toString();
  };

  const survivalCapValue = reactForm.watch('survivalCap');
  const preserveStreakValue = reactForm.watch('preserveStreak');
  const shotInTheDarkValue = reactForm.watch('shotInTheDarkEnabled');

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-3'>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-1 h-8'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Survival Streak
          </Text>
        </View>
        {!disabled && (
          <Button
            onPress={() => {
              if (locked) {
                setLocked(false);
              } else {
                resetSettings();
              }
            }}>
            {locked ? (
              <Lock size={24} color={colors.primary} />
            ) : (
              <LockOpen size={24} color={colors.primary} />
            )}
          </Button>
        )}
      </View>

      {/* Description */}
      <Text className='text-base text-muted-foreground'>
        The <Text className='italic'>Survival Streak</Text> rewards players for picking a castaway
        that survives each episode.
      </Text>

      {/* How it works */}
      <View className=''>
        <Text className='text-base text-muted-foreground'>
          Each episode your pick survives, their streak grows:
        </Text>
        <View className='ml-4'>
          <Text className='text-base text-muted-foreground'>
            • <Text className='font-bold'>Episode 1:</Text> Earn 1
            <View className='translate-y-0.5'>
              <PointsIcon size={12} color={colors['muted-foreground']} />
            </View> point
          </Text>
          <Text className='text-base text-muted-foreground'>
            • <Text className='font-bold'>Episode 2:</Text> Earn 2
            <View className='translate-y-0.5'>
              <PointsIcon size={12} color={colors['muted-foreground']} />
            </View> point
          </Text>
          <Text className='text-base text-muted-foreground'>
            • <Text className='font-bold'>Episode 3:</Text> Earn 3
            <View className='translate-y-0.5'>
              <PointsIcon size={12} color={colors['muted-foreground']} />
            </View> point
          </Text>
        </View>
        <Text className='text-base text-muted-foreground'>
          If your pick is eliminated, you must choose a new unclaimed castaway, and your streak
          resets.
        </Text>
      </View>

      {/* Action Buttons */}
      {!locked && (
        <View className='flex-row gap-2'>
          <Button
            className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
            onPress={resetSettings}>
            <Text className='text-center font-semibold text-white'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              !settingsChanged && 'opacity-50'
            )}
            disabled={!settingsChanged}
            onPress={() => handleSubmit()}>
            <Text className='text-center font-semibold text-white'>Save</Text>
          </Button>
        </View>
      )}
      {/* Streak Cap */}
      <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
        <View className='flex-row items-center'>
          <Text className='font-bold text-foreground mr-2'>Streak Cap</Text>
          {locked && (
            <>
              <Text
                className={cn(
                  'text-lg font-bold',
                  survivalCapValue > 0 ? 'text-green-600' : 'text-destructive'
                )}>
                {displaySurvivalCap(survivalCapValue)}
              </Text>
              {survivalCapValue > 0 && survivalCapValue < MAX_SEASON_LENGTH && (
                <PointsIcon size={14} color={colors.positive} />
              )}
            </>
          )}
        </View>
        {!locked && (
          <Controller
            control={reactForm.control}
            name='survivalCap'
            render={({ field }) => (
              <View className='flex-row items-center gap-2 my-2'>
                <Slider
                  style={{ flex: 1 }}
                  minimumValue={0}
                  maximumValue={MAX_SEASON_LENGTH}
                  step={1}
                  value={field.value}
                  onValueChange={field.onChange}
                  minimumTrackTintColor={colors.secondary}
                  maximumTrackTintColor={colors.accent}
                  thumbTintColor={colors.primary} />
                <Text
                  className={cn(
                    'text-lg font-bold w-24 text-left',
                    field.value > 0 ? 'text-green-600' : 'text-destructive'
                  )}>
                  {displaySurvivalCap(field.value)}
                </Text>
              </View>
            )} />
        )}
        <Text className='text-base text-muted-foreground'>
          Set a cap on the maximum points a player can earn from their streak.
        </Text>
        <Text className='text-base text-muted-foreground mt-1'>
          <Text className='font-medium text-muted-foreground'>Note: </Text>
          A cap of <Text className='italic'>0</Text> will disable survival points entirely, while an{' '}
          <Text className='italic'>unlimited</Text> cap will heavily favor the player who drafts the
          winner.
        </Text>
      </View>

      {/* Preserve Streak */}
      <View
        className={cn(
          'rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2',
          survivalCapValue === 0 && 'opacity-50'
        )}>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Text className='font-bold text-foreground mr-2'>Preserve Streak</Text>
            {locked && (
              <Text
                className={cn(
                  'text-lg font-bold',
                  preserveStreakValue ? 'text-green-600' : 'text-destructive'
                )}>
                {preserveStreakValue ? 'On' : 'Off'}
              </Text>
            )}
          </View>
          {!locked && (
            <Controller
              control={reactForm.control}
              name='preserveStreak'
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={survivalCapValue === 0}
                  trackColor={{ false: colors.destructive, true: colors.positive }}
                  thumbColor='white' />
              )}
            />
          )}
        </View>
        <Text className='text-base text-muted-foreground mt-1'>
          Should streaks be <Text className='italic'>preserved</Text> if a player switches their
          pick voluntarily, or reset to zero?
        </Text>
        {survivalCapValue === 0 && (
          <Text className='text-sm text-primary italic'>
            This feature requires survival streaks to be enabled.
          </Text>
        )}
      </View>

      {/* Shot in the Dark */}
      <View
        className={cn(
          'rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2',
          survivalCapValue === 0 && 'opacity-50'
        )}>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Text className='font-bold text-foreground mr-2'>Shot in the Dark</Text>
            {locked && (
              <Text
                className={cn(
                  'text-lg font-bold',
                  shotInTheDarkValue ? 'text-green-600' : 'text-destructive'
                )}>
                {shotInTheDarkValue ? 'On' : 'Off'}
              </Text>
            )}
          </View>
          {!locked && (
            <Controller
              control={reactForm.control}
              name='shotInTheDarkEnabled'
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={survivalCapValue === 0}
                  trackColor={{ false: colors.destructive, true: colors.positive }}
                  thumbColor='white' />
              )} />
          )}
        </View>
        <Text className='text-base text-muted-foreground'>
          Members get one chance per season to protect their streak when their castaway is
          eliminated. Must be activated before the episode airs.
        </Text>
        {survivalCapValue === 0 && (
          <Text className='text-sm text-primary italic'>
            This feature requires survival streaks to be enabled.
          </Text>
        )}
      </View>
    </View>
  );
}
