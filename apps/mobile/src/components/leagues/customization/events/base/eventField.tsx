import { Controller, type UseFormReturn } from 'react-hook-form';
import { Text, View, TextInput } from 'react-native';
import { colors, getPointsColor } from '~/lib/colors';
import { BaseEventDescriptions, BaseEventFullName } from '~/lib/events';
import { cn } from '~/lib/utils';
import { BasePredictions } from '~/components/leagues/customization/events/base/predictions';
import { type ScoringBaseEventName } from '~/types/events';
import { PointsIcon } from '~/components/icons/generated';

interface EventFieldProps {
  reactForm: UseFormReturn<any>;
  eventName: ScoringBaseEventName;
  fieldPath: string;
  disabled?: boolean;
  hidePrediction?: boolean;
}

export default function EventField({
  reactForm,
  eventName,
  fieldPath,
  disabled,
  hidePrediction,
}: EventFieldProps) {
  const currentValue = reactForm.watch(fieldPath);
  const hasItalicDescription =
    BaseEventDescriptions.italics?.[eventName as keyof typeof BaseEventDescriptions.italics];

  return (
    <View className='gap-1.5 rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
      {/* Header Row */}
      <View className='flex-row items-center justify-between'>
        <Text className='flex-1 text-base font-semibold text-foreground'>
          {BaseEventFullName[eventName as keyof typeof BaseEventFullName]}
        </Text>

        {disabled ? (
          <View className='flex-row items-center'>
            <Text
              className={cn(
                'text-lg font-bold',
                currentValue === 0
                  ? 'text-neutral'
                  : currentValue > 0
                    ? 'text-positive'
                    : 'text-destructive'
              )}>
              {currentValue > 0 ? `+${currentValue}` : currentValue}
            </Text>
            <PointsIcon size={14} color={getPointsColor(currentValue)} />
          </View>
        ) : (
          <Controller
            control={reactForm.control}
            name={fieldPath}
            render={({ field }) => {
              const numericValue = typeof field.value === 'number' ? field.value : 0;
              const sign = numericValue < 0 ? -1 : 1;
              const absValue = Math.abs(numericValue);

              return (
                <View className='flex-row items-center'>
                  <Text
                    onPress={() => field.onChange(sign * -1 * absValue)}
                    className={cn(
                      'text-center text-2xl font-bold',
                      sign === 1 ? 'text-positive' : 'text-destructive',
                      field.value === 0 && 'text-neutral',
                    )}>
                    {sign === 1 ? '+' : '−'}
                  </Text>
                  <TextInput
                    className='w-16 rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-center text-base font-bold leading-5'
                    keyboardType='number-pad'
                    value={absValue === 0 ? '' : absValue.toString()}
                    onChangeText={(text) => {
                      const next = parseInt(text.replace(/[^0-9]/g, ''), 10);
                      field.onChange(sign * (Number.isNaN(next) ? 0 : next));
                    }}
                    placeholder='0'
                    placeholderTextColor={colors['muted-foreground']} />
                  <PointsIcon size={18} color={getPointsColor(numericValue)} />
                </View>
              );
            }} />
        )}
      </View>

      {/* Description */}
      <Text className='text-sm leading-tight text-muted-foreground'>
        {BaseEventDescriptions.main[eventName as keyof typeof BaseEventDescriptions.main]}
        {hasItalicDescription && (
          <Text className='italic text-muted-foreground'> {hasItalicDescription}</Text>
        )}
      </Text>

      {/* Predictions (if enabled) */}
      {!hidePrediction && (
        <BasePredictions eventName={eventName} reactForm={reactForm} disabled={disabled} />
      )}
    </View>
  );
}
