import { View, Text, Pressable } from 'react-native';
import { Controller } from 'react-hook-form';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { type DraftDetails } from '~/types/leagues';
import { useChooseCastaway } from '~/hooks/leagues/mutation/useChooseCastaway';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';
import { getContrastingColor } from '@uiw/color-convert';

interface ChooseCastawayProps {
  hash: string;
  draftDetails?: DraftDetails;
  onDeck: boolean;
}

export default function ChooseCastaway({ hash, draftDetails, onDeck }: ChooseCastawayProps) {
  const { reactForm, handleSubmit } = useChooseCastaway(hash);

  const selectedCastawayId = reactForm.watch('castawayId');
  const isValid = !!selectedCastawayId;
  const canSubmit = !onDeck && isValid;

  // Build castaway options from draft details
  const selectOptions = Object.values(draftDetails ?? {}).flatMap(({ tribe, castaways }) =>
    castaways.map(({ castaway, member }) => {
      const isDisabled = !!member;

      return {
        value: castaway.castawayId,
        label: castaway.fullName,
        disabled: isDisabled,
        renderLabel: () => (
          <View
            className='flex-1 flex-row items-center gap-2 rounded-md p-1'
            style={isDisabled ? { backgroundColor: member?.color ?? colors.neutral } : undefined}>
            <ColorRow className='w-min' color={tribe.tribeColor}>
              <Text
                className='text-base font-medium leading-tight'
                style={isDisabled ? { color: getContrastingColor(member.color ?? colors.neutral) } : undefined}>
                {tribe.tribeName}
              </Text>
            </ColorRow>
            <Text
              className='text-base'
              style={isDisabled ? { color: getContrastingColor(member.color ?? colors.neutral) } : undefined}>
              {castaway.fullName}
              {member && ` (${member.displayName})`}
            </Text>
          </View>
        ),
      };
    })
  );

  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2'>
      {/* Header */}
      <View className='flex-row items-center gap-2 px-1'>
        <View className='h-6 w-1 rounded-full bg-primary' />
        <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
          {onDeck ? 'You\'re On Deck' : 'You\'re On The Clock!'}
        </Text>
      </View>

      {onDeck && (
        <Text className='text-base text-muted-foreground px-1'>
          Get ready — you're picking next!
        </Text>
      )}

      {/* Castaway Select */}
      <Controller
        control={reactForm.control}
        name='castawayId'
        render={({ field }) => (
          <SearchableSelect
            options={selectOptions}
            selectedValue={field.value}
            onSelect={(value) => field.onChange(value)}
            placeholder='Select castaway' />
        )} />

      {/* Submit Button */}
      <Pressable
        onPress={() => void handleSubmit()}
        disabled={!canSubmit}
        className={cn(
          'rounded-lg bg-primary p-3 active:opacity-80',
          !canSubmit && 'opacity-50'
        )}>
        <Text className='text-center text-base font-bold uppercase tracking-wider text-primary-foreground'>
          {onDeck ? 'Almost Time!' : 'Submit Pick'}
        </Text>
      </Pressable>
    </View>
  );
}
