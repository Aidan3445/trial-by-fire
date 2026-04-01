import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Controller } from 'react-hook-form';
import { RotateCcw, HelpCircle, X } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useMakePrediction } from '~/hooks/leagues/mutation/useMakePrediction';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';
import Modal from '~/components/common/modal';
import { type ReferenceType, type MakePrediction } from '~/types/events';
import { colors } from '~/lib/colors';
import Button from '~/components/common/button';

interface SubmissionCardProps {
  prediction: MakePrediction;
  options: Record<ReferenceType | 'Direct Castaway', Record<string, { id: number; color: string; tribeName?: string }>>;
  maxBet?: number;
  wallet?: number;
  updateBetTotal: (_eventName: string, _bet: number) => void;
  totalBet?: number;
  onSubmitSuccess?: () => void;
}

export default function SubmissionCard({
  wallet,
  prediction,
  options,
  maxBet,
  updateBetTotal,
  totalBet,
  onSubmitSuccess,
}: SubmissionCardProps) {
  const { data: league } = useLeague();
  const [helpVisible, setHelpVisible] = useState(false);

  const { reactForm, handleSubmit } = useMakePrediction(league?.hash ?? '', prediction, options);
  const { control, reset, setValue, formState: { isDirty, isSubmitting } } = reactForm;

  useEffect(() => {
    if (!prediction?.predictionMade) return;
    reset({
      referenceId: prediction.predictionMade?.referenceId,
      bet: prediction.predictionMade?.bet ?? undefined,
    });
    updateBetTotal(prediction.eventName, prediction.predictionMade?.bet ?? 0);
  }, [prediction?.predictionMade, reset, prediction.eventName, updateBetTotal]);

  // Build select options based on prediction.referenceTypes
  const selectOptions = useMemo(() => {
    const result: {
      value: number;
      label: string;
      disabled?: boolean;
      renderLabel: () => ReactNode;
    }[] = [];

    const referenceTypes = prediction.referenceTypes ?? ['Castaway'];
    const includeTribes = referenceTypes.includes('Tribe');
    const includeCastaways = referenceTypes.includes('Castaway');

    // Add tribe options
    if (includeTribes && options.Tribe) {
      Object.entries(options.Tribe)
        .sort(([nameA], [nameB]) => nameA.localeCompare(nameB))
        .forEach(([name, vals]) => {
          result.push({
            value: vals.id,
            label: name,
            renderLabel: () => (
              <View className='flex-1 flex-row items-center gap-2 rounded-md p-1'>
                <ColorRow className='w-min px-2' color={vals.color}>
                  <Text className='text-base font-medium'>{name}</Text>
                </ColorRow>
              </View>
            ),
          });
        });
    }

    // Add castaway options (from both Castaway and Direct Castaway)
    if (includeCastaways) {
      const castawayEntries: [string, { id: number; color: string; tribeName?: string }][] = [];

      if (options.Castaway) {
        castawayEntries.push(...Object.entries(options.Castaway));
      }
      if (options['Direct Castaway']) {
        castawayEntries.push(...Object.entries(options['Direct Castaway']));
      }

      castawayEntries
        .sort(([nameA, valsA], [nameB, valsB]) =>
          (valsA.tribeName?.localeCompare(valsB.tribeName ?? '') ?? 0) || nameA.localeCompare(nameB)
        )
        .forEach(([name, vals]) => {
          result.push({
            value: vals.id,
            label: name,
            renderLabel: () => (
              <View className='flex-1 flex-row items-center gap-2 rounded-md p-1'>
                {vals.tribeName && (
                  <ColorRow className='w-min px-2' color={vals.color}>
                    <Text className='text-base font-medium'>{vals.tribeName}</Text>
                  </ColorRow>
                )}
                <Text className='text-base text-foreground'>{name}</Text>
              </View>
            ),
          });
        });
    }

    return result;
  }, [options, prediction.referenceTypes]);

  const handleReset = () => {
    reset();
    setValue('bet', prediction.predictionMade?.bet ?? undefined);
    updateBetTotal(prediction.eventName, prediction.predictionMade?.bet ?? 0);
  };

  const onSubmit = async () => {
    await handleSubmit(onSubmitSuccess);
  };

  const isSubmitDisabled =
    !isDirty || isSubmitting || (prediction.shauhinEnabled && (wallet ?? 0) - (totalBet ?? 0) < 0);

  return (
    <View className='gap-2 p-2 bg-card/50 justify-end'>
      <View className='flex-row items-center gap-2'>
        {/* Reset Button */}
        <Button
          onPress={handleReset}
          disabled={!isDirty}
          className={cn('p-2', !isDirty && 'opacity-50')}>
          <RotateCcw size={16} color={colors.foreground} />
        </Button>

        {/* Select */}
        <View className='flex-1'>
          <Controller
            control={control}
            name='referenceId'
            render={({ field: { value, onChange } }) => (
              <SearchableSelect
                options={selectOptions}
                selectedValue={value}
                onSelect={onChange}
                placeholder='Select prediction'
                className={cn(
                  isDirty && value !== prediction?.predictionMade?.referenceId && 'bg-amber-400'
                )}
              />
            )}
          />
        </View>
      </View>

      {/* Bet Input (if shauhin enabled) */}
      {prediction.shauhinEnabled && !!wallet && (
        <View className='flex-row items-center gap-2'>
          <Button onPress={() => setHelpVisible(true)} className='p-2'>
            <HelpCircle size={16} color={colors.mutedForeground} />
          </Button>
          <Controller
            control={control}
            name='bet'
            render={({ field: { value, onChange } }) => (
              <TextInput
                allowFontScaling={false}
                className={cn(
                  'flex-1 rounded-lg border-2 border-primary/20 bg-card px-3 py-1.5 text-base text-foreground',
                  isDirty && value !== prediction?.predictionMade?.bet && 'bg-amber-400'
                )}
                keyboardType='numeric'
                placeholder='Enter bet'
                placeholderTextColor={colors.mutedForeground}
                value={value?.toString() ?? ''}
                onChangeText={(text) => {
                  const num = text === '' ? 0 : Math.max(0, Math.min(Number(text), maxBet || 1000)) || 0;
                  onChange(num);
                  updateBetTotal(prediction.eventName, num);
                }} />
            )} />
        </View>
      )}

      {/* Submit Button */}
      <Button
        onPress={() => void onSubmit()}
        disabled={isSubmitDisabled}
        className={cn('rounded-lg bg-primary p-3 active:opacity-80', isSubmitDisabled && 'opacity-50')}>
        <Text allowFontScaling={false} className='text-center font-bold text-primary-foreground'>
          {prediction.predictionMade ? 'Update' : 'Submit'}
        </Text>
      </Button>

      {/* Shauhin Help Modal */}
      <Modal visible={helpVisible} onClose={() => setHelpVisible(false)}>
        <View className='gap-3'>
          <View className='flex-row items-center justify-between'>
            <Text className='text-lg font-bold text-foreground'>Shauhin Mode</Text>
            <Button onPress={() => setHelpVisible(false)}>
              <X size={20} color={colors.mutedForeground} />
            </Button>
          </View>
          <Text className='text-base text-foreground'>
            If your prediction is correct, you will earn the bet amount in points. Miss it, and you lose the bet amount.
          </Text>
          <Text className='text-base text-foreground'>
            Bets are limited to a maximum of {maxBet ?? 1000} points.
          </Text>
          <Text className='text-sm text-muted-foreground'>
            Note: Bets are only available for certain predictions as defined in the league settings.
          </Text>
        </View>
      </Modal>
    </View>
  );
}
