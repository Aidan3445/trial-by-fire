'use client';

import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { Button } from '~/components/common/button';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from '~/components/common/select';
import ColorRow from '~/components/shared/colorRow';
import { useSecondaryPick } from '~/hooks/leagues/enrich/useSecondaryPick';

interface SecondaryPickFormProps {
  onSubmitted?: () => void;
  className?: string;
}

export default function SecondaryPickForm({ onSubmitted, className }: SecondaryPickFormProps) {
  const { options, currentPickId, submit, isSubmitting } = useSecondaryPick();
  const [selected, setSelected] = useState(currentPickId ? `${currentPickId}` : '');

  // Follow the saved pick when it loads or changes
  useEffect(() => {
    setSelected(currentPickId ? `${currentPickId}` : '');
  }, [currentPickId]);

  const selectedCastaway = options.find(({ castaway }) => `${castaway.castawayId}` === selected)?.castaway;
  const isDirty = !!selected && selected !== `${currentPickId}`;

  const handleSubmit = async () => {
    if (!isDirty) return;
    const success = await submit(parseInt(selected));
    if (success) onSubmitted?.();
  };

  return (
    <span className={cn('grid lg:grid-cols-6 grid-cols-1 gap-2 items-center py-2 px-2', className)}>
      <Select value={selected} onValueChange={setSelected}>
        <SelectTrigger className={cn(
          'py-0 [&>span]:line-clamp-none lg:col-span-4',
          isDirty && currentPickId !== null && 'bg-amber-400')}>
          {selectedCastaway ? (
            <span className='flex items-center justify-start gap-1 text-nowrap'>
              {selectedCastaway.tribe && (
                <ColorRow className='w-20 justify-center leading-tight mr-1' color={selectedCastaway.tribe.color}>
                  {selectedCastaway.tribe.name}
                </ColorRow>
              )}
              {selectedCastaway.fullName}
            </span>
          ) : (
            <SelectValue placeholder='Select secondary pick' />
          )}
        </SelectTrigger>
        <SelectContent className='z-50'>
          <SelectGroup>
            {options.map(({ castaway, disabledReason }) => disabledReason ? (
              <SelectLabel key={castaway.castawayId} className='cursor-not-allowed opacity-50'>
                <span className='flex items-center gap-1 w-full text-nowrap'>
                  {castaway.tribe && (
                    <ColorRow
                      className='w-20 justify-center leading-tight font-medium! tracking-normal! normal-case! text-sm'
                      color={castaway.tribe.color}>
                      {castaway.tribe.name}
                    </ColorRow>
                  )}
                  {castaway.fullName} ({disabledReason})
                </span>
              </SelectLabel>
            ) : (
              <SelectItem key={castaway.castawayId} value={`${castaway.castawayId}`}>
                <span className='flex items-center gap-1 w-full text-nowrap'>
                  {castaway.tribe && (
                    <ColorRow className='w-20 justify-center leading-tight' color={castaway.tribe.color}>
                      {castaway.tribe.name}
                    </ColorRow>
                  )}
                  {castaway.fullName}
                </span>
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <Button
        className='w-full lg:col-span-2 lg:ml-2'
        disabled={!isDirty || isSubmitting}
        type='button'
        onClick={() => void handleSubmit()}>
        {currentPickId !== null ? 'Update' : 'Submit'}
      </Button>
    </span>
  );
}
