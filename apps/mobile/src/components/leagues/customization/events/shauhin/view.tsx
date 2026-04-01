import { Lock, LockOpen } from 'lucide-react-native';
import { Text, View, Switch, TextInput, Platform } from 'react-native';
import Button from '~/components/common/button';
import { Controller } from 'react-hook-form';
import { useShauhinMode } from '~/hooks/leagues/mutation/useShauhinMode';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import {
  ABS_MAX_EVENT_POINTS,
  SHAUHIN_MODE_MAX_MAX_BETS_PER_WEEK,
  ShauhinModeTimings
} from '~/lib/leagues';
import { BaseEventFullName } from '~/lib/events';
import * as WebBrowser from 'expo-web-browser';
import { type ScoringBaseEventName } from '~/types/events';
import SearchableMultiSelect from '~/components/common/searchableMultiSelect';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';
import { PointsIcon } from '~/components/icons/generated';

export default function ShauhinMode() {
  const {
    reactForm,
    locked,
    setLocked,
    rulesChanged,
    handleSubmit,
    resetSettings,
    disabled,
    rules
  } = useShauhinMode();

  const shauhinEnabled = reactForm.watch('enabled');
  const startWeek = reactForm.watch('startWeek');
  const customStartWeek = reactForm.watch('customStartWeek');
  const maxBet = reactForm.watch('maxBet');
  const maxBetsPerWeek = reactForm.watch('maxBetsPerWeek');
  const enabledBets = reactForm.watch('enabledBets');

  const timingOptions = ShauhinModeTimings.map(timing => ({ value: timing, label: timing }));

  const betsOptions = Object.entries(rules?.basePrediction ?? {})
    .filter(([_, setting]) => setting.enabled)
    .map(([eventName]) => ({
      value: eventName as ScoringBaseEventName,
      label: BaseEventFullName[eventName as ScoringBaseEventName]
    }));

  const openTikTokLink = () => {
    WebBrowser.openBrowserAsync('https://www.tiktok.com/t/ZT62XJL2V/');
  };

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      {/* Header */}
      <View className='flex-row items-center justify-between mb-2'>
        <View className='flex-row items-center gap-1 h-8'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Shauhin Mode
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
        Inspired by a{' '}
        <Text className='text-primary underline' onPress={openTikTokLink}>
          video
        </Text>{' '}
        that{' '}
        <View className={cn(Platform.OS === 'ios' ? 'translate-y-4' : 'translate-y-2')}>
          <ColorRow color='#d05dbd' className='py-0'>
            <Text className='font-medium text-base text-primary'>Shauhin Davari</Text>
          </ColorRow>
        </View>
        , from Survivor 48, posted, this twist allows you to bet points you've earned throughout the
        season on predictions. If you win, you gain those points in addition to the base points for
        the event. If you miss the prediction, you get nothing.
      </Text>

      {/* Save / Cancel Buttons */}
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
              !rulesChanged && 'opacity-50'
            )}
            disabled={!rulesChanged || (startWeek === 'Custom' && (!customStartWeek || customStartWeek < 1))}
            onPress={() => handleSubmit()}>
            <Text className='text-center font-semibold text-white'>Save</Text>
          </Button>
        </View>
      )}
      {/* Shauhin Mode Toggle */}
      <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
        <View className='flex-row items-center justify-between'>
          <View className='flex-row items-center'>
            <Text className='font-bold text-foreground mr-2 w-max'>Shauhin Mode</Text>
            {locked && (
              <Text
                className={cn(
                  'text-lg font-bold',
                  shauhinEnabled ? 'text-positive' : 'text-destructive'
                )}>
                {shauhinEnabled ? 'On' : 'Off'}
              </Text>
            )}
          </View>
          {!locked && (
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

      {shauhinEnabled && (
        <>
          {/* Start Timing */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
            <View className='flex-row items-center mb-1'>
              <Text className='font-bold text-foreground mr-2'>Start Timing</Text>
              {locked && (
                <Text className='text-lg font-bold text-positive'>
                  {startWeek === 'Custom'
                    ? `Custom (after ${customStartWeek} episodes)`
                    : startWeek}
                </Text>
              )}
            </View>
            {!locked && (
              <View className='gap-2'>
                <Controller
                  control={reactForm.control}
                  name='startWeek'
                  render={({ field }) => (
                    <SearchableSelect
                      options={timingOptions}
                      selectedValue={field.value ?? ''}
                      onSelect={field.onChange}
                      placeholder='Search timing options...'>
                      <Text className='text-foreground'>
                        {startWeek || 'Select Betting Start Week'}
                      </Text>
                    </SearchableSelect>
                  )} />
                {startWeek === 'Custom' && (
                  <Controller
                    control={reactForm.control}
                    name='customStartWeek'
                    render={({ field }) => (
                      <View>
                        <TextInput
                          className='w-1/2 rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base font-bold leading-5'
                          placeholder='Enable after episode...'
                          placeholderTextColor={colors.primary}
                          value={field.value?.toString() ?? ''}
                          onChangeText={text => field.onChange(text)}
                          keyboardType='numeric' />
                        {field?.value && field.value > 14 && (
                          <Text className='mt-1 text-sm text-destructive'>
                            Warning: Most seasons do not have this many weeks!
                          </Text>
                        )}
                      </View>
                    )} />
                )}
              </View>
            )}
            <Text className='text-base text-muted-foreground'>
              Choose when Shauhin Mode activates. You can choose from predefined timings or set a
              custom week for betting to start.
            </Text>
          </View>

          {/* Max Bets Settings */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
            <View className='flex-col gap-4'>
              {/* Max Points Per Bet */}
              <View className='w-full'>
                <View className='flex-row items-center'>
                  <Text className='font-bold text-foreground mr-2'>Max Per Bet</Text>
                  {locked && (
                    <>
                      <Text className='text-lg font-bold text-positive'>
                        {maxBet === 0 ? 'Unlimited' : maxBet}
                      </Text>
                      <PointsIcon size={14} color={colors.positive} />
                    </>
                  )}
                </View>
                {!locked && (
                  <Controller
                    control={reactForm.control}
                    name='maxBet'
                    render={({ field }) => (
                      <TextInput
                        className='rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base font-bold leading-5' placeholder='0 = Unlimited'
                        placeholderTextColor={colors.primary}
                        value={field.value?.toString() === '0' ? '' : field.value?.toString() ?? '0'}
                        onChangeText={text => {
                          const value = Math.min(parseInt(text) || 0, ABS_MAX_EVENT_POINTS);
                          field.onChange(value);
                        }}
                        keyboardType='numeric' />
                    )} />
                )}
                <Text className='text-base text-muted-foreground'>
                  <Text className='italic'>Max Per Bet</Text>: max points you can bet on a prediction
                </Text>
              </View>

              {/* Max Bets Per Week */}
              <View className=''>
                <View className='flex-row items-center'>
                  <Text className='font-bold text-foreground mr-2'>Max Per Week</Text>
                  {locked && (
                    <Text className='text-lg font-bold text-positive'>
                      {maxBetsPerWeek === 0 ? 'Unlimited' : maxBetsPerWeek}
                    </Text>
                  )}
                </View>
                {!locked && (
                  <Controller
                    control={reactForm.control}
                    name='maxBetsPerWeek'
                    render={({ field }) => (
                      <TextInput
                        className='rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base font-bold leading-5'
                        placeholder='0 = Unlimited'
                        placeholderTextColor={colors.primary}
                        value={field.value?.toString() === '0' ? '' : field.value?.toString() ?? '0'}
                        onChangeText={text => {
                          const value = Math.min(
                            parseInt(text) || 0,
                            SHAUHIN_MODE_MAX_MAX_BETS_PER_WEEK
                          );
                          field.onChange(value);
                        }}
                        keyboardType='numeric' />
                    )} />
                )}
                <Text className='text-base text-muted-foreground'>
                  <Text className='italic'>Max Per Week</Text>: max number of bets per week
                </Text>
              </View>
            </View>
          </View>

          {/* Enabled Bets */}
          <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
            <View className='flex-row items-center'>
              <Text className='font-bold text-foreground mr-2 w-full'>Enabled Bets</Text>
            </View>
            {locked ? (
              <Text className='text-base text-foreground'>
                {enabledBets && enabledBets.length > 0
                  ? enabledBets
                    .map((name: ScoringBaseEventName) => BaseEventFullName[name])
                    .join(', ')
                  : 'None'}
              </Text>
            ) : (
              <Controller
                control={reactForm.control}
                name='enabledBets'
                render={({ field }) => (
                  <SearchableMultiSelect
                    options={betsOptions}
                    selectedValues={field.value || []}
                    onToggleSelect={field.onChange}
                    placeholder='Search bet options...'>
                    <Text className='text-base flex-shrink'>
                      {enabledBets && enabledBets.length > 0
                        ? enabledBets
                          .map((name: ScoringBaseEventName) => BaseEventFullName[name])
                          .join(', ')
                        : 'Select enabled bets'}
                    </Text>
                  </SearchableMultiSelect>
                )} />
            )}
            <Text className='text-base text-muted-foreground'>
              Select what you can bet on from your enabled official and custom prediction events.
            </Text>
          </View>
        </>
      )}
    </View>
  );
}
