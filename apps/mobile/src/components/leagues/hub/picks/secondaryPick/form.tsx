import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import SearchableSelect from '~/components/common/searchableSelect';
import ColorRow from '~/components/shared/colorRow';
import Button from '~/components/common/button';
import { useSecondaryPick } from '~/hooks/leagues/mutation/useSecondaryPick';

interface SecondaryPickFormProps {
  onSubmitted?: () => void;
  className?: string;
}

export default function SecondaryPickForm({ onSubmitted, className }: SecondaryPickFormProps) {
  const { options, currentPickId, submit, isSubmitting } = useSecondaryPick();
  const [selected, setSelected] = useState<number | undefined>(currentPickId ?? undefined);

  // Follow the saved pick when it loads or changes
  useEffect(() => {
    setSelected(currentPickId ?? undefined);
  }, [currentPickId]);

  const isDirty = selected !== undefined && selected !== currentPickId;

  const selectOptions = options.map(({ castaway, disabledReason }) => {
    const label = disabledReason ? `${castaway.fullName} (${disabledReason})` : castaway.fullName;
    return {
      value: castaway.castawayId,
      label,
      disabled: !!disabledReason,
      renderLabel: () => (
        <View className={cn('flex-1 flex-row items-center gap-2', disabledReason && 'opacity-50')}>
          {castaway.tribe && (
            <ColorRow className='w-min' color={castaway.tribe.color}>
              <Text className='text-base font-medium'>{castaway.tribe.name}</Text>
            </ColorRow>
          )}
          <Text className='text-base text-foreground w-5/6'>{label}</Text>
        </View>
      ),
    };
  });

  const onSubmit = async () => {
    if (!isDirty) return;
    const success = await submit(selected);
    if (success) onSubmitted?.();
  };

  return (
    <View className={cn('gap-2 p-2', className)}>
      <SearchableSelect
        options={selectOptions}
        selectedValue={selected}
        onSelect={setSelected}
        placeholder='Select secondary pick' />
      <Button
        onPress={() => void onSubmit()}
        disabled={!isDirty || isSubmitting}
        className={cn(
          'rounded-lg bg-primary p-3 active:opacity-80',
          (!isDirty || isSubmitting) && 'opacity-50'
        )}>
        <Text allowFontScaling={false} className='text-center font-bold text-primary-foreground'>
          {isSubmitting ? 'Submitting...' : currentPickId !== null ? 'Update' : 'Submit'}
        </Text>
      </Button>
    </View>
  );
}
