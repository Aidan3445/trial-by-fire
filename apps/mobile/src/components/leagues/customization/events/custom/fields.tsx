import { Text, View, TextInput } from 'react-native';
import { Controller, type UseFormReturn } from 'react-hook-form';
import { useState } from 'react';
import { type CustomEventRuleInsert } from '~/types/leagues';
import { EventTypes, PredictionTimings, ReferenceTypes } from '~/lib/events';
import SearchableMultiSelect from '~/components/common/searchableMultiSelect';
import SearchableSelect from '~/components/common/searchableSelect';
import { cn } from '~/lib/utils';
import { colors, getPointsColor } from '~/lib/colors';
import { type EventType, type PredictionTiming, type ReferenceType } from '~/types/events';
import PredictionTimingHelp from '~/components/leagues/actions/events/predictions/timingHelp';
import { PointsIcon } from '~/components/icons/generated';

interface CustomEventFieldsProps {
  reactForm: UseFormReturn<CustomEventRuleInsert>;
  predictionDefault?: boolean;
}

export default function CustomEventFields({
  reactForm,
  predictionDefault
}: CustomEventFieldsProps) {
  const [isPrediction, setIsPrediction] = useState(predictionDefault ?? false);

  const eventTypeOptions = EventTypes.map(type => ({ value: type, label: type }));
  const referenceTypeOptions = ReferenceTypes.map(type => ({ value: type, label: type }));
  const timingOptions = PredictionTimings.map(timing => ({ value: timing, label: timing }));

  const selectedEventType = reactForm.watch('eventType');
  const selectedReferences = reactForm.watch('referenceTypes') || [];
  const selectedTimings = reactForm.watch('timing') || [];

  return (
    <View className='gap-4'>
      {/* Event Name */}
      <View>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
          Event Name
        </Text>
        <Controller
          control={reactForm.control}
          name='eventName'
          render={({ field }) => (
            <TextInput
              className='rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base font-bold leading-5'
              placeholder='Enter the name of the event'
              placeholderTextColor={colors.primary}
              value={field.value}
              onChangeText={field.onChange} />
          )} />
      </View>

      {/* Description */}
      <View>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
          Description
        </Text>
        <Controller
          control={reactForm.control}
          name='description'
          render={({ field }) => (
            <TextInput
              className='rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base leading-5 h-20'
              placeholder='Points awarded to...'
              placeholderTextColor={colors.primary}
              value={field.value}
              onChangeText={field.onChange}
              multiline
              textAlignVertical='top' />
          )} />
      </View>

      {/* Reference Type */}
      <View>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
          Reference Type
        </Text>
        <Controller
          control={reactForm.control}
          name='referenceTypes'
          render={({ field }) => (
            <SearchableMultiSelect<ReferenceType>
              options={referenceTypeOptions}
              selectedValues={selectedReferences}
              onToggleSelect={field.onChange}
              placeholder='Search reference types...'>
              <Text className='text-base flex-shrink'>
                {selectedReferences?.length > 0
                  ? selectedReferences.join(', ')
                  : 'Select prediction timing'}
              </Text>
            </SearchableMultiSelect>
          )}
        />
      </View>

      {/* Points & Event Type Row */}
      <View className='flex-row gap-4'>
        <View className='flex-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
            Points
          </Text>
          <Controller
            control={reactForm.control}
            name={'points'}
            render={({ field }) => {
              const numericValue = typeof field.value === 'number' ? field.value : 0;
              const sign = numericValue < 0 ? -1 : 1;
              const absValue = Math.abs(numericValue);

              return (
                <View className='flex-row items-center'>
                  <Text
                    onPress={() => field.onChange(sign * -1 * absValue)}
                    className={cn(
                      'text-center text-3xl font-bold leading-none',
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
        </View>
        <View className='flex-[2]'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
            Event Type
          </Text>
          <Controller
            control={reactForm.control}
            name='eventType'
            render={({ field }) => (
              <SearchableSelect<EventType>
                options={eventTypeOptions}
                selectedValue={selectedEventType}
                onSelect={value => {
                  setIsPrediction(value === 'Prediction');
                  field.onChange(value);
                  reactForm.trigger('timing');
                }}
                placeholder='Search event types...'>
                <Text className='text-base flex-shrink'>
                  {selectedEventType ?? 'Select event type'}
                </Text>
              </SearchableSelect>
            )}
          />
        </View>
      </View>

      {/* Timing (only for Prediction type) */}
      {isPrediction && (
        <View>
          <View className='flex-row items-center gap-2 mb-1'>
            <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
              Timing
            </Text>
            <PredictionTimingHelp />
          </View>
          <Controller
            control={reactForm.control}
            name='timing'
            render={({ field }) => (
              <SearchableMultiSelect<PredictionTiming>
                options={timingOptions}
                selectedValues={selectedTimings}
                onToggleSelect={field.onChange}
                placeholder='Search timing options...'>
                <Text className='text-base flex-shrink'>
                  {selectedTimings?.length > 0
                    ? selectedTimings.join(', ')
                    : 'Select prediction timing'}
                </Text>
              </SearchableMultiSelect>
            )}
          />
        </View>
      )}
    </View>
  );
}
