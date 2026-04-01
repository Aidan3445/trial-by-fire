import { View, Text, Switch, Pressable } from 'react-native';
import { Controller } from 'react-hook-form';
import { Lock, LockOpen } from 'lucide-react-native';
import { useSecondaryPickSettings } from '~/hooks/leagues/mutation/useSecondaryPickSettings';
import { MAX_SEASON_LENGTH } from '~/lib/leagues';
import Button from '~/components/common/button';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import Slider from '@react-native-community/slider';

export default function SecondaryPickSettings() {
  const {
    reactForm,
    locked,
    editable,
    isDirty,
    unlock,
    lock,
    handleSubmit,
  } = useSecondaryPickSettings();

  if (!editable) return null;

  const enabled = reactForm.watch('enabled');

  const displayLockoutValue = (value: number) => {
    if (value === 0 || value === undefined) return 'Off';
    if (value === MAX_SEASON_LENGTH) return 'Never repeat';
    return value.toString();
  };

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-3'>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>Secondary Pick</Text>
        </View>
        <Pressable onPress={locked ? unlock : lock}>
          {locked ? (
            <Lock size={24} color={colors.primary} />
          ) : (
            <LockOpen size={24} color={colors.secondary} />
          )}
        </Pressable>
      </View>

      {/* Description */}
      <Text className='text-sm text-muted-foreground'>
        Allow members to choose an additional castaway between episodes to earn bonus points.
        Unlike the main draft, multiple members can select the same secondary for a given episode.
      </Text>

      {/* Enabled Toggle */}
      <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
        <View className='flex-row items-center justify-between'>
          <Text className='font-bold text-foreground'>Secondary Pick</Text>
          {locked ? (
            <Text className={cn('font-semibold', enabled ? 'text-positive' : 'text-destructive')}>
              {enabled ? 'On' : 'Off'}
            </Text>
          ) : (
            <Controller
              control={reactForm.control}
              name='enabled'
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ false: colors.destructive, true: colors.positive }}
                  thumbColor='white' />
              )} />
          )}
        </View>
      </View>

      {/* Settings (when enabled) */}
      {enabled && (
        <View className='gap-3'>
          {/* Can Pick Own Survivor */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
            <View className='flex-row items-center justify-between'>
              <Text className='font-bold text-foreground'>Allow Own Survivor</Text>
              {locked ? (
                <Controller
                  control={reactForm.control}
                  name='canPickOwnSurvivor'
                  render={({ field }) => (
                    <Text className={cn('font-semibold', field.value ? 'text-positive' : 'text-destructive')}>
                      {field.value ? 'Yes' : 'No'}
                    </Text>
                  )} />
              ) : (
                <Controller
                  control={reactForm.control}
                  name='canPickOwnSurvivor'
                  render={({ field }) => (
                    <Switch
                      value={field.value}
                      onValueChange={field.onChange}
                      trackColor={{ false: colors.destructive, true: colors.positive }}
                      thumbColor='white' />
                  )} />
              )}
            </View>
            <Text className='text-sm text-muted-foreground'>
              Can members select their current survivor as their secondary pick?
            </Text>
          </View>

          {/* Lockout Period */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
            <Controller
              control={reactForm.control}
              name='lockoutPeriod'
              render={({ field }) => (
                <>
                  {locked ? (
                    <View className='flex-row items-center justify-between'>
                      <Text className='font-bold text-foreground'>Lockout Period</Text>
                      <Text className='text-sm text-muted-foreground'>
                        {field.value === MAX_SEASON_LENGTH
                          ? 'Never repeat'
                          : `${field.value} episodes`}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text className='font-bold text-foreground'>Lockout Period</Text>
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
                            'text-lg font-bold w-24 text-left leading-none',
                            field.value > 0 ? 'text-green-600' : 'text-destructive'
                          )}>
                          {displayLockoutValue(field.value)}
                        </Text>
                      </View>
                    </>
                  )}
                </>
              )} />
            <Text className='text-sm text-muted-foreground'>
              Episodes before a castaway can be selected again as a secondary pick.
            </Text>
          </View>

          {/* Public Picks */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
            <View className='flex-row items-center justify-between'>
              <Text className='font-bold text-foreground'>Public Picks</Text>
              {locked ? (
                <Controller
                  control={reactForm.control}
                  name='publicPicks'
                  render={({ field }) => (
                    <Text className={cn('font-semibold', field.value ? 'text-positive' : 'text-destructive')}>
                      {field.value ? 'Yes' : 'No'}
                    </Text>
                  )} />
              ) : (
                <Controller
                  control={reactForm.control}
                  name='publicPicks'
                  render={({ field }) => (
                    <Switch
                      value={field.value}
                      onValueChange={field.onChange}
                      trackColor={{ false: colors.destructive, true: colors.positive }}
                      thumbColor='white' />
                  )} />
              )}
            </View>
            <Text className='text-sm text-muted-foreground'>
              Should members see other members' secondary picks before the episode airs?
            </Text>
          </View>

          {/* Multiplier */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
            <Controller
              control={reactForm.control}
              name='multiplier'
              render={({ field }) => (
                <>
                  {locked ? (
                    <View className='flex-row items-center justify-between'>
                      <Text className='font-bold text-foreground'>Points Multiplier</Text>
                      <Text className='text-sm text-muted-foreground'>
                        {field.value === 1 ? 'Full (100%)' : '1/2 (50%)'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text className='font-bold text-foreground mb-2'>Points Multiplier</Text>
                      <View className='flex-row gap-2'>
                        <Pressable
                          className={cn(
                            'flex-1 rounded-lg border-2 p-2 active:opacity-80',
                            field.value === 0.5
                              ? 'border-primary bg-primary/10'
                              : 'border-primary/20 bg-card'
                          )}
                          onPress={() => field.onChange(0.5)}>
                          <Text
                            className={cn(
                              'text-center font-semibold',
                              field.value === 0.5 ? 'text-primary' : 'text-foreground'
                            )}>
                            1/2 (50%)
                          </Text>
                        </Pressable>
                        <Pressable
                          className={cn(
                            'flex-1 rounded-lg border-2 p-2 active:opacity-80',
                            field.value === 1
                              ? 'border-primary bg-primary/10'
                              : 'border-primary/20 bg-card'
                          )}
                          onPress={() => field.onChange(1)}>
                          <Text
                            className={cn(
                              'text-center font-semibold',
                              field.value === 1 ? 'text-primary' : 'text-foreground'
                            )}>
                            Full (100%)
                          </Text>
                        </Pressable>
                      </View>
                    </>
                  )}
                </>
              )} />
            <Text className='text-sm text-muted-foreground'>
              Percentage of points earned by secondary pick castaway.
            </Text>
          </View>
        </View>
      )}

      {/* Action Buttons */}
      {!locked && (
        <View className='flex-row gap-2'>
          <Button
            className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
            onPress={lock}>
            <Text className='text-center font-semibold text-white'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              !isDirty && 'opacity-50'
            )}
            disabled={!isDirty}
            onPress={() => handleSubmit()}>
            <Text className='text-center font-semibold text-white'>Save</Text>
          </Button>
        </View>
      )}
    </View>
  );
}
