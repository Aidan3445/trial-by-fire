'use client';

import { type ReactNode } from 'react';
import { Card, CardContent } from '~/components/common/card';
import ColorRow from '~/components/shared/colorRow';
import { PointsIcon } from '~/components/icons/generated';
import { useEpisodeTracker } from '~/hooks/leagues/enrich/useEpisodeTracker';
import { cn } from '~/lib/utils';
import { type PredictionStatus, type TrackedEvent } from '~/lib/scores';

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

function Points({ value, muted, className }: { value: number; muted?: boolean; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-bold tabular-nums text-nowrap',
      muted ? 'text-muted-foreground' : value > 0 ? 'text-green-700' : value < 0 ? 'text-destructive' : 'text-muted-foreground',
      className)}>
      {signed(value)}
      <PointsIcon className={cn('w-3.5 h-min', muted || value === 0 ? 'fill-muted-foreground' : 'fill-current')} />
    </span>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className='flex flex-col gap-1.5 rounded-lg border-2 border-primary/20 bg-accent/50 p-2 min-w-0'>
      <header className='flex items-center justify-between gap-2'>
        <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>{title}</h3>
        {aside}
      </header>
      {children}
    </section>
  );
}

function EventRows({ events, empty }: { events: TrackedEvent[]; empty: string }) {
  if (events.length === 0) {
    return <p className='text-sm text-muted-foreground italic'>{empty}</p>;
  }
  return (
    <ul className='flex flex-col gap-0.5'>
      {events.map((event, index) => (
        <li key={`${event.eventSource}-${event.eventId ?? index}`} className='flex items-center justify-between gap-2 text-sm'>
          <span className='truncate'>
            {event.label}
            {event.viaTribe && <span className='ml-1 text-xs text-muted-foreground'>(tribe)</span>}
          </span>
          <Points value={event.points} />
        </li>
      ))}
    </ul>
  );
}

const STATUS_STYLES: Record<PredictionStatus, string> = {
  hit: 'bg-green-600 text-white',
  miss: 'bg-destructive text-white',
  pending: 'bg-muted-foreground/20 text-muted-foreground',
};

/**
  * Replaces the locked pick and prediction forms while an episode airs with a
  * running tally of what the member has earned in it.
  */
export default function EpisodeTracker() {
  const { tracker, castaways, tribes } = useEpisodeTracker();
  if (!tracker) return null;

  const castaway = (castawayId: number) => castaways?.find((c) => c.castawayId === castawayId);
  const referenceName = (type: 'Castaway' | 'Tribe', id: number) => type === 'Castaway'
    ? castaway(id)?.fullName ?? 'Unknown castaway'
    : tribes?.find((tribe) => tribe.tribeId === id)?.tribeName ?? 'Unknown tribe';

  const castawayRow = (castawayId: number) => {
    const c = castaway(castawayId);
    return (
      <ColorRow color={c?.tribe?.color} className='font-bold text-base'>
        {c?.fullName ?? 'Unknown castaway'}
      </ColorRow>
    );
  };

  return (
    <Card className='w-full bg-card rounded-lg border-2 border-primary/20 p-4'>
      <CardContent className='p-0 flex flex-col gap-3'>
        <header className='flex items-center justify-between gap-3'>
          <div className='flex items-center gap-3 min-w-0'>
            <span className='h-9 md:h-9 w-1 bg-primary rounded-full shrink-0' />
            <div className='min-w-0'>
              <h2 className='md:text-xl font-black uppercase tracking-tight leading-none text-left'>
                This Episode
              </h2>
              <p className='text-sm text-muted-foreground truncate'>
                <span className='mr-1 inline-block size-2 rounded-full bg-green-600 animate-pulse align-middle' />
                Live: {tracker.episode.episodeNumber}: {tracker.episode.title}
              </p>
            </div>
          </div>
          <Points value={tracker.total} className='text-2xl' />
        </header>

        <div className='grid gap-2 md:grid-cols-2 xl:grid-cols-3'>
          <Section title='Your Survivor' aside={tracker.pick && <Points value={tracker.pick.points} />}>
            {tracker.pick ? (
              <>
                {castawayRow(tracker.pick.castawayId)}
                <EventRows events={tracker.pick.events} empty='No points yet this episode' />
              </>
            ) : (
              <p className='text-sm text-muted-foreground italic'>No survivor picked for this episode</p>
            )}
            {tracker.shotInTheDark && (
              <p className='text-xs font-bold text-primary'>Shot in the Dark is protecting your streak</p>
            )}
          </Section>

          {tracker.secondary && (
            <Section
              title='Secondary Pick'
              aside={
                <span className='flex items-center gap-1.5'>
                  <span className='rounded-md bg-primary/15 px-1.5 text-xs font-bold text-primary'>
                    ×{tracker.secondary.multiplier}
                  </span>
                  <Points value={tracker.secondary.points} />
                </span>
              }>
              {castawayRow(tracker.secondary.castawayId)}
              <EventRows events={tracker.secondary.events} empty='No points yet this episode' />
              {tracker.secondary.events.length > 0 && (
                <p className='text-xs text-muted-foreground'>
                  {signed(tracker.secondary.basePoints)} × {tracker.secondary.multiplier} = {signed(tracker.secondary.points)}
                </p>
              )}
            </Section>
          )}

          {tracker.predictions.length > 0 && (
            <Section title='Predictions'>
              <ul className='flex flex-col gap-1'>
                {tracker.predictions.map((prediction) => (
                  <li key={`${prediction.eventSource}-${prediction.predictionId}`} className='flex flex-col text-sm'>
                    <span className='flex items-center justify-between gap-2'>
                      <span className='truncate'>
                        <span className='font-medium'>{prediction.label}:</span>{' '}
                        {referenceName(prediction.reference.type, prediction.reference.id)}
                      </span>
                      <span className='flex items-center gap-1.5 shrink-0'>
                        <span className={cn('rounded-md px-1.5 text-xs font-bold uppercase', STATUS_STYLES[prediction.status])}>
                          {prediction.status}
                        </span>
                        <Points
                          value={prediction.status === 'miss' ? 0 : prediction.points}
                          muted={prediction.status === 'pending'} />
                      </span>
                    </span>
                    {prediction.bet !== null && (
                      <span className='flex items-center justify-end gap-1 text-xs text-muted-foreground'>
                        Bet {prediction.bet}
                        {prediction.status === 'pending'
                          ? ' at stake'
                          : <Points value={prediction.betResult} className='text-xs' />}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {tracker.survivalBonus > 0 && (
            <p className='flex items-end justify-end gap-1 text-sm text-muted-foreground'>
              Survival streak bonus <Points value={tracker.survivalBonus} />
            </p>
          )}
        </div>

      </CardContent>
    </Card>
  );
}
