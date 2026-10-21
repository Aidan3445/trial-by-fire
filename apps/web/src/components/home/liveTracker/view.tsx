'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '~/components/common/card';
import { PointsIcon } from '~/components/icons/generated';
import { useEpisodeTracker } from '~/hooks/leagues/enrich/useEpisodeTracker';
import { useLeagues } from '~/hooks/user/useLeagues';
import { cn } from '~/lib/utils';
import { type League } from '~/types/leagues';

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

function Points({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 font-bold tabular-nums text-nowrap',
      value > 0 ? 'text-green-700' : value < 0 ? 'text-destructive' : 'text-muted-foreground',
      className)}>
      {signed(value)}
      <PointsIcon className={cn('w-3 h-min', value === 0 ? 'fill-muted-foreground' : 'fill-current')} />
    </span>
  );
}

function Chip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <span className='inline-flex items-center gap-1.5 rounded-md bg-accent/70 border border-primary/20 px-2 py-0.5 text-sm'>
      <span className='text-muted-foreground'>{label}</span>
      {children}
    </span>
  );
}

function LiveLeagueRow({ league, onLive }: { league: League; onLive: (_hash: string, _live: boolean) => void }) {
  const { tracker, castaways } = useEpisodeTracker(league.hash);
  const live = !!tracker;

  useEffect(() => onLive(league.hash, live), [league.hash, live, onLive]);
  if (!tracker) return null;

  const shortName = (castawayId: number) =>
    castaways?.find((castaway) => castaway.castawayId === castawayId)?.shortName ?? 'Survivor';
  const settled = tracker.predictions.filter((prediction) => prediction.status !== 'pending');
  const hits = settled.filter((prediction) => prediction.status === 'hit').length;
  const pending = tracker.predictions.length - settled.length;
  const predictionPoints = tracker.predictions.reduce((total, prediction) =>
    total + (prediction.status === 'hit' ? prediction.points : 0) + prediction.betResult, 0);

  return (
    <Link
      href={`/leagues/${league.hash}`}
      className='flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-lg border-2 border-primary/20 bg-primary/5 p-2 hover:bg-primary/10 hover:border-primary/30 transition-all'>
      <span className='font-black text-lg leading-tight truncate min-w-0 flex-1 basis-40'>{league.name}</span>
      <span className='flex flex-wrap items-center gap-1.5'>
        <Chip label={tracker.pick ? shortName(tracker.pick.castawayId) : 'No pick'}>
          <Points value={tracker.pick?.points ?? 0} />
        </Chip>
        {tracker.secondary && (
          <Chip label={`${shortName(tracker.secondary.castawayId)} ×${tracker.secondary.multiplier}`}>
            <Points value={tracker.secondary.points} />
          </Chip>
        )}
        {tracker.predictions.length > 0 && (
          <Chip label={`Predictions ${hits}/${settled.length}${pending ? ` · ${pending} pending` : ''}`}>
            <Points value={predictionPoints} />
          </Chip>
        )}
      </span>
      <Points value={tracker.total} className='text-xl ml-auto' />
    </Link>
  );
}

/**
  * While an episode airs, how the user is doing in each of their leagues
  */
export function LiveTracker() {
  const { data: leagues } = useLeagues();
  const [live, setLive] = useState<Set<string>>(new Set());

  const onLive = useCallback((hash: string, isLive: boolean) => {
    setLive((prev) => {
      if (prev.has(hash) === isLive) return prev;
      const next = new Set(prev);
      if (isLive) next.add(hash);
      else next.delete(hash);
      return next;
    });
  }, []);

  const activeLeagues = leagues?.filter(({ league }) => league.status === 'Active') ?? [];
  if (activeLeagues.length === 0) return null;

  // Rows decide for themselves whether their league is airing; the card shows once one is
  return (
    <Card className={cn('relative overflow-hidden border-2 border-primary/20', live.size === 0 && 'hidden')}>
      <CardHeader className='pb-2'>
        <div className='flex items-center gap-3'>
          <div className='h-6 md:h-8 w-1 bg-primary rounded-full' />
          <h2 className='text-xl md:text-3xl font-black tracking-tight uppercase'>Live Now</h2>
          <span className='size-2.5 rounded-full bg-green-600 animate-pulse' />
        </div>
        <p className='text-sm text-muted-foreground'>Your points this episode in each league</p>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        {activeLeagues.map(({ league }) => (
          <LiveLeagueRow key={league.hash} league={league} onLive={onLive} />
        ))}
      </CardContent>
    </Card>
  );
}
