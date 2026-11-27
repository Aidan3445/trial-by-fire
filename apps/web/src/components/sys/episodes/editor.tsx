'use client';

import { useState } from 'react';
import { Button } from '~/components/common/button';
import { Input } from '~/components/common/input';
import { Label } from '~/components/common/label';
import { Switch } from '~/components/common/switch';
import { DateTimePicker } from '~/components/common/dateTimePicker';

export interface EpisodeDraft {
  episodeNumber: number;
  title: string;
  airDate: Date;
  runtime: number;
  isMerge: boolean;
  isFinale: boolean;
}

/** Premieres and finales run long */
export function defaultRuntime(episodeNumber: number, isFinale: boolean) {
  return isFinale ? 180 : episodeNumber === 1 ? 120 : 90;
}

interface EpisodeEditorProps {
  initial: EpisodeDraft;
  /** Whether the episode is already in the database (update) or not (import) */
  existing: boolean;
  /** Episode numbers other episodes of the season already use */
  takenNumbers: number[];
  /** What an outside source (fandom) lists, shown when it differs from the form */
  reference?: { source: string; title: string; airDate: Date };
  onSave: (_draft: EpisodeDraft) => Promise<void>;
}

/**
  * Edit an episode's details before importing or updating it
  */
export default function EpisodeEditor({ initial, existing, takenNumbers, reference, onSave }: EpisodeEditorProps) {
  const [draft, setDraft] = useState(initial);
  // The runtime follows the finale switch until it's set by hand
  const [runtimeTouched, setRuntimeTouched] = useState(existing);
  const [saving, setSaving] = useState(false);

  const update = (changes: Partial<EpisodeDraft>) => setDraft((current) => ({ ...current, ...changes }));

  const numberTaken = takenNumbers.includes(draft.episodeNumber);
  const valid = Number.isInteger(draft.episodeNumber) && draft.episodeNumber > 0
    && draft.title.trim() !== ''
    && !isNaN(draft.airDate.getTime())
    && Number.isInteger(draft.runtime) && draft.runtime > 0
    && !numberTaken;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ ...draft, title: draft.title.trim() });
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className='flex flex-col gap-4' action={() => save()}>
      <div className='flex gap-4'>
        <div className='flex flex-col gap-2 w-24'>
          <Label htmlFor='episode-number'>Episode</Label>
          <Input
            id='episode-number'
            type='number'
            min={1}
            value={isNaN(draft.episodeNumber) ? '' : draft.episodeNumber}
            onChange={(e) => {
              const episodeNumber = parseInt(e.target.value, 10);
              update({
                episodeNumber,
                ...(!runtimeTouched && { runtime: defaultRuntime(episodeNumber, draft.isFinale) }),
              });
            }} />
        </div>
        <div className='flex flex-col gap-2 flex-1'>
          <Label htmlFor='episode-title'>Title</Label>
          <Input
            id='episode-title'
            value={draft.title}
            onChange={(e) => update({ title: e.target.value })} />
          {reference && reference.title !== draft.title && (
            <p className='text-xs text-muted-foreground'>
              {reference.source}: {reference.title}
            </p>
          )}
        </div>
      </div>
      {numberTaken && (
        <p className='text-sm text-destructive'>Another episode is already number {draft.episodeNumber}.</p>
      )}

      <div className='flex flex-col gap-2'>
        <DateTimePicker
          value={draft.airDate}
          onChange={(airDate) => update({ airDate })} />
        {reference && reference.airDate.getTime() !== draft.airDate.getTime() && (
          <p className='text-xs text-muted-foreground'>
            {reference.source}: {reference.airDate.toLocaleString()}
          </p>
        )}
      </div>

      <div className='flex flex-wrap items-center gap-6'>
        <div className='flex items-center gap-2'>
          <Label htmlFor='episode-runtime'>Runtime (min)</Label>
          <Input
            id='episode-runtime'
            type='number'
            min={1}
            className='w-20'
            value={isNaN(draft.runtime) ? '' : draft.runtime}
            onChange={(e) => {
              update({ runtime: parseInt(e.target.value, 10) });
              setRuntimeTouched(true);
            }} />
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id='episode-merge'
            checked={draft.isMerge}
            onCheckedChange={(isMerge) => update({ isMerge })} />
          <Label htmlFor='episode-merge'>Merge</Label>
        </div>
        <div className='flex items-center gap-2'>
          <Switch
            id='episode-finale'
            checked={draft.isFinale}
            onCheckedChange={(isFinale) => update({
              isFinale,
              ...(!runtimeTouched && { runtime: defaultRuntime(draft.episodeNumber, isFinale) }),
            })} />
          <Label htmlFor='episode-finale'>Finale</Label>
        </div>
      </div>

      <Button type='submit' disabled={!valid || saving}>
        {saving ? 'Saving...' : existing ? 'Update' : 'Import'}
      </Button>
    </form>
  );
}
