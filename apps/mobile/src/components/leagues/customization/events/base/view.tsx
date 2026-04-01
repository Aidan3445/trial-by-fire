'use client';
import { Lock, LockOpen } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import { useBaseEventRules } from '~/hooks/leagues/mutation/useBaseEventRules';
import { colors } from '~/lib/colors';
import ChallengeScoreSettings from '~/components/leagues/customization/events/base/challenges';
import AdvantageScoreSettings from '~/components/leagues/customization/events/base/advantages';
import OtherScoreSettings from '~/components/leagues/customization/events/base/other';

export default function BaseEventRules() {
  const {
    reactForm,
    locked,
    setLocked,
    rulesChanged,
    handleSubmit,
    resetSettings,
    disabled
  } = useBaseEventRules();

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-1 h-8'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Official Events
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
              <LockOpen size={24} color={colors.secondary} />
            )}
          </Button>
        )}
      </View>
      <Text className='text-base text-muted-foreground'>
        These Official Events are automatically scored for your league based on what drafted
        castaways do in the show. Set the point values for each event.
      </Text>
      <View className='gap-2'>
        {!locked && (
          <View className='flex-row gap-2'>
            <Button
              className='flex-1 rounded-lg bg-destructive p-3'
              onPress={resetSettings}>
              <Text className='text-center font-semibold text-white'>Cancel</Text>
            </Button>
            <Button
              className={'flex-1 rounded-lg bg-primary p-3'}
              disabled={!rulesChanged}
              onPress={() => handleSubmit()}>
              <Text className='text-center font-semibold text-white'>Save</Text>
            </Button>
          </View>
        )}
        <View className='gap-2'>
          <ChallengeScoreSettings reactForm={reactForm} disabled={locked || disabled} />
          <AdvantageScoreSettings reactForm={reactForm} disabled={locked || disabled} />
          <OtherScoreSettings reactForm={reactForm} disabled={locked || disabled} />
        </View>
      </View>
    </View>
  );
}
