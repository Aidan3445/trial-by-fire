'use client';

import { Button } from '~/components/common/button';
import { BaseEventFullName } from '~/lib/events';
import { cn } from '~/lib/utils';
import { type AutoEvent, type EventReference } from '~/types/events';

interface AutoEventCardProps {
  autoEvent: AutoEvent;
  /** Unseen until this panel opened */
  fresh: boolean;
  /** Currently filling the base event form */
  inForm: boolean;
  /** A similar event is already scored for the episode */
  scored: boolean;
  referenceName: (_ref: EventReference) => string;
  onAccept: () => void;
  onDeny: () => void;
  onRestore: () => void;
}

const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function AutoEventCard({
  autoEvent, fresh, inForm, scored, referenceName, onAccept, onDeny, onRestore
}: AutoEventCardProps) {
  const pending = autoEvent.status === 'pending';
  const asks = [...new Set(autoEvent.asks.map((ask) => ask.field.replace(/^ref:.*/, 'references')))];

  return (
    <article className={cn(
      'rounded-lg border-2 bg-card p-3 flex flex-col gap-1.5 shadow-sm',
      fresh ? 'border-primary/60' : 'border-primary/20',
      !pending && 'opacity-70')}>
      <header className='flex items-start justify-between gap-2'>
        <div className='flex flex-col'>
          <span className='font-bold leading-tight'>
            {BaseEventFullName[autoEvent.eventName]}
            {fresh && <span className='ml-2 text-[10px] uppercase tracking-wider text-primary'>New</span>}
          </span>
          <span className='text-sm text-muted-foreground'>{autoEvent.subtype ?? 'Type unsure'}</span>
        </div>
        <div className='flex flex-col items-end text-xs text-muted-foreground shrink-0'>
          {autoEvent.confidence !== null && <span className='font-bold text-foreground'>{percent(autoEvent.confidence)}</span>}
          {autoEvent.detections > 1 && <span>seen {autoEvent.detections}×</span>}
        </div>
      </header>

      <div className='flex flex-wrap gap-1 text-sm'>
        {autoEvent.references.map((ref) => (
          <span key={`${ref.type}_${ref.id}`} className='rounded-md bg-accent px-1.5 py-0.5'>
            {referenceName(ref)}
          </span>
        ))}
        {autoEvent.unmatched.map((name) => (
          <span
            key={name}
            className='rounded-md border border-dashed border-primary/40 px-1.5 py-0.5 italic'
            title='Name not matched to a castaway or tribe'>
            {name}?
          </span>
        ))}
        {autoEvent.references.length === 0 && autoEvent.unmatched.length === 0 && (
          <span className='text-muted-foreground italic'>Who: ?</span>
        )}
      </div>

      {autoEvent.notes?.map((note) => (
        <p key={note} className='text-xs text-muted-foreground'>{note}</p>
      ))}
      {asks.length > 0 && pending && (
        <p className='text-xs text-muted-foreground'>Check: {asks.join(', ')}</p>
      )}
      {scored && (
        <p className='text-xs font-bold text-destructive'>A matching event is already scored this episode</p>
      )}
      {autoEvent.trigger && (
        <p className='text-xs text-muted-foreground italic truncate' title={autoEvent.trigger}>
          {autoEvent.segment}: “{autoEvent.trigger}”
        </p>
      )}

      <footer className='flex items-center justify-end gap-2 pt-1'>
        {pending ? (
          <>
            {inForm && <span className='mr-auto text-xs font-bold text-primary'>In the form</span>}
            <Button size='sm' variant='outline' onClick={onDeny}>Deny</Button>
            <Button size='sm' onClick={onAccept}>Accept</Button>
          </>
        ) : (
          <>
            <span className='mr-auto text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              {autoEvent.status === 'denied' ? 'Denied' : autoEvent.used ? 'Accepted' : 'Accepted, all data replaced'}
            </span>
            {autoEvent.status === 'denied' && (
              <Button size='sm' variant='ghost' onClick={onRestore}>Restore</Button>
            )}
          </>
        )}
      </footer>
    </article>
  );
}
