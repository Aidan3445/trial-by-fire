import { Text, View, TextInput, Switch } from 'react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type PredictionTiming } from '~/types/events';
import { PredictionTimings } from '~/lib/events';
import { type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import SearchableMultiSelect from '~/components/common/searchableMultiSelect';
import { PointsIcon } from '~/components/icons/generated';

interface BasePredictionFormFieldProps {
  eventName: string;
  reactForm: UseFormReturn<any>;
  disabled?: boolean;
}

export function BasePredictions({ eventName, reactForm, disabled }: BasePredictionFormFieldProps) {
  const predictionEnabled = reactForm.watch(`basePredictionRules.${eventName}.enabled`) as boolean;
  const predictionPoints = reactForm.watch(`basePredictionRules.${eventName}.points`) as number;
  const predictionTiming = reactForm.watch(
    `basePredictionRules.${eventName}.timing`
  ) as PredictionTiming[];

  const timingOptions: SearchableOption<PredictionTiming>[] = PredictionTimings.map(timing => ({
    value: timing,
    label: timing
  }));

  return (
    <View>
      <View className='bg-primary/20 h-0.5 rounded-full' />
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <Text className='text-base font-medium'>Prediction:</Text>
          {disabled ? (
            <Text
              className={`font-semibold ${predictionEnabled ? 'text-positive' : 'text-destructive'}`}>
              {predictionEnabled ? 'On' : 'Off'}
            </Text>
          ) : (
            <Controller
              control={reactForm.control}
              name={`basePredictionRules.${eventName}.enabled`}
              render={({ field }) => (
                <Switch
                  className='mt-1'
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ false: colors.destructive, true: colors.positive }}
                  thumbColor={colors.muted} />
              )} />
          )}
        </View>
        {predictionEnabled && (
          <View className='flex-row items-center'>
            <Text className='text-base font-medium'>Points: </Text>
            {disabled ? (
              <View className='flex-row items-center'>
                <Text
                  className={cn(
                    'text-base font-bold',
                    predictionPoints <= 0 ? 'text-destructive' : 'text-positive',
                    predictionPoints === 0 && 'text-neutral'
                  )}>
                  {predictionPoints}
                </Text>
              </View>
            ) : (
              <Controller
                control={reactForm.control}
                name={`basePredictionRules.${eventName}.points`}
                render={({ field }) => (
                  <TextInput
                    className='w-16 rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-center text-base font-bold leading-5'
                    value={field.value?.toString() ?? '0'}
                    onChangeText={text => {
                      const value = parseInt(text) || 0;
                      field.onChange(value);
                    }}
                    keyboardType='numeric' />
                )} />
            )}
            <PointsIcon size={14} color={colors.positive} />
          </View>
        )}
      </View>

      {predictionEnabled && (
        <View className='mt-2'>
          {disabled ? (
            <Text className='text-sm italic text-muted-foreground'>
              {predictionTiming?.join(', ') || 'No timing set'}
            </Text>
          ) : (
            <View>
              <Controller
                control={reactForm.control}
                name={`basePredictionRules.${eventName}.timing`}
                render={({ field }) => (
                  <SearchableMultiSelect
                    options={timingOptions}
                    selectedValues={field.value}
                    onToggleSelect={field.onChange}
                    placeholder='Search timing options...'
                    emptyMessage='No timing options found.'>
                    <Text className='text-base flex-shrink'>
                      {predictionTiming?.length > 0
                        ? predictionTiming.join(', ')
                        : 'Select prediction timing'}
                    </Text>
                  </SearchableMultiSelect>
                )} />
            </View>
          )}
          {predictionTiming.includes('Weekly') && predictionTiming.length > 1 && (
            <Text className='mt-1 text-sm text-muted-foreground'>
              <Text className='font-medium'>Note: </Text>
              Weekly will cause predictions to be collected each week, ignoring any other timing options.
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
