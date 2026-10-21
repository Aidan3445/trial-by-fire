'use client';

import { FormLabel } from '~/components/common/form';
import { Input } from '~/components/common/input';
import { cn } from '~/lib/utils';
import { tribeNameTaken } from '~/lib/events';
import { type TribeInsert } from '~/types/tribes';

interface TribeFieldsProps {
  label: string;
  value: TribeInsert;
  onChange: (_value: TribeInsert) => void;
  /** Tribe names already in the season, other than this tribe's own */
  takenNames: string[];
  placeholder?: string;
  /** Shown after the name when it is taken */
  takenHint?: string;
  disabled?: boolean;
}

/**
  * Name and color for the tribe a tribe update creates, or renames after creating it
  */
export default function TribeFields({ label, value, onChange, takenNames, placeholder, takenHint, disabled }: TribeFieldsProps) {
  return (
    <div className={cn('flex flex-col gap-1', disabled && 'pointer-events-none opacity-50')}>
      <FormLabel className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>
        {label}
      </FormLabel>
      <span className='flex gap-2'>
        <Input
          type='text'
          placeholder={placeholder ?? 'Tribe name'}
          maxLength={16}
          disabled={disabled}
          value={value.tribeName}
          onChange={(e) => onChange({ ...value, tribeName: e.target.value })} />
        <Input
          type='color'
          className='w-14 shrink-0 p-1'
          aria-label={`${label} color`}
          disabled={disabled}
          value={value.tribeColor}
          onChange={(e) => onChange({ ...value, tribeColor: e.target.value })} />
      </span>
      {tribeNameTaken(value.tribeName, takenNames) && (
        <p className='text-sm text-destructive'>
          {value.tribeName.trim()} already exists{takenHint ? `, ${takenHint}` : ''}
        </p>
      )}
    </div>
  );
}
