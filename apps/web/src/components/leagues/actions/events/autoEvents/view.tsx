'use client';

import { useEffect, useMemo, useState } from 'react';
import { Radar } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/common/popover';
import { ScrollArea, ScrollBar } from '~/components/common/scrollArea';
import { Switch } from '~/components/common/switch';
import { Button } from '~/components/common/button';
import AutoEventCard from '~/components/leagues/actions/events/autoEvents/card';
import { useAutoEvents, useUpdateAutoEvents } from '~/hooks/seasons/useAutoEvents';
import { useBaseEvents } from '~/hooks/seasons/useBaseEvents';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { useTribes } from '~/hooks/seasons/useTribes';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { useAutoEventContext } from '~/context/autoEventContext';
import { findScoredMatch } from '~/lib/events';
import { cn } from '~/lib/utils';
import { type AutoEvent, type EventReference } from '~/types/events';

interface AutoEventsProps {
  seasonId: number;
}

/**
  * Button under the league tabs, with a popover listing the events caption detectors found this season.
  * The badge counts auto events not yet accepted or denied, and pulses while some are unseen.
  */
export default function AutoEvents({ seasonId }: AutoEventsProps) {
  const { data: autoEvents } = useAutoEvents(seasonId);
  const { mutate: updateAutoEvents } = useUpdateAutoEvents(seasonId);
  const { data: baseEvents } = useBaseEvents(seasonId);
  const { data: castaways } = useCastaways(seasonId);
  const { data: tribes } = useTribes(seasonId);
  const { data: episodes } = useEpisodes(seasonId);
  const { applyAutoEvent, activeAutoEvent } = useAutoEventContext();

  const [open, setOpen] = useState(false);
  const [showHandled, setShowHandled] = useState(false);
  // Auto events that were unseen when the panel showed them; highlighted until it closes
  const [fresh, setFresh] = useState<Set<number>>(new Set());

  const pending = useMemo(() => autoEvents?.filter((autoEvent) => autoEvent.status === 'pending') ?? [], [autoEvents]);
  // Keyed on the ids so a refetch with the same unseen auto events doesn't mark them again
  const unseenKey = pending.filter((autoEvent) => !autoEvent.viewed).map((autoEvent) => autoEvent.autoEventId).join(',');
  const unseenIds = useMemo(() => unseenKey ? unseenKey.split(',').map(Number) : [], [unseenKey]);

  useEffect(() => {
    if (!open || unseenIds.length === 0) return;
    setFresh((prev) => new Set([...prev, ...unseenIds]));
    updateAutoEvents({ autoEventIds: unseenIds, action: 'view' });
  }, [open, unseenIds, updateAutoEvents]);

  const scoredEvents = useMemo(() =>
    Object.values(baseEvents ?? {}).flatMap((episodeEvents) => Object.values(episodeEvents)),
    [baseEvents]);

  const referenceName = (ref: EventReference) => ref.type === 'Castaway'
    ? castaways?.find((castaway) => castaway.castawayId === ref.id)?.fullName ?? `Castaway ${ref.id}`
    : tribes?.find((tribe) => tribe.tribeId === ref.id)?.tribeName ?? `Tribe ${ref.id}`;

  // Newest episode first; within an episode, oldest auto event first
  const byEpisode = useMemo(() => {
    const shown = (showHandled ? autoEvents : pending) ?? [];
    const groups = new Map<number, AutoEvent[]>();
    for (const autoEvent of shown) {
      const group = groups.get(autoEvent.episodeNumber) ?? [];
      group.push(autoEvent);
      groups.set(autoEvent.episodeNumber, group);
    }
    return [...groups.entries()].sort(([a], [b]) => b - a);
  }, [autoEvents, pending, showHandled]);

  const accept = (autoEvent: AutoEvent) => {
    applyAutoEvent(autoEvent);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setFresh(new Set());
      }}>
      <PopoverTrigger asChild>
        <Button
          aria-label={`Auto events: ${pending.length} to review`}
          className={cn(
            'relative w-10 h-10 p-0 rounded-lg bg-accent border-2 border-primary/40 hover:bg-secondary/90',
            'hover:border-primary/60 hover:scale-110 transition-all shadow-lg shadow-primary/20')}>
          <Radar className='w-5! h-5! text-primary' />
          {pending.length > 0 && (
            <span className={cn(
              'absolute -top-2 -right-2 min-w-5 h-5 px-1 rounded-full text-[11px] font-bold leading-5 text-center',
              unseenIds.length > 0
                ? 'bg-primary text-primary-foreground animate-pulse'
                : 'bg-muted-foreground text-background')}>
              {pending.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='end'
        sideOffset={8}
        collisionPadding={8}
        className='w-[min(24rem,calc(100vw-1rem))] p-0 flex flex-col overflow-hidden border-2 border-primary/20'>
        <header className='flex flex-col gap-1 px-4 py-3 border-b-2 border-primary/20'>
          <div className='flex items-center justify-between gap-2'>
            <h2 className='font-black uppercase tracking-tight'>Auto Events</h2>
            <label className='flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground'>
              <Switch checked={showHandled} onCheckedChange={setShowHandled} />
              Show handled
            </label>
          </div>
          <p className='text-xs text-muted-foreground'>
            Found in the captions. Accept to open the event form filled in.
          </p>
        </header>
        <ScrollArea className={cn(
          'max-h-[min(32rem,calc(100svh-14rem))] **:data-radix-scroll-area-viewport:max-h-[min(32rem,calc(100svh-14rem))]',
          // Radix lays the content out as a table, which lets long lines widen it past the popover
          '[&_[data-radix-scroll-area-viewport]>div]:block!')}>
          <div className='flex flex-col gap-4 p-3'>
            {byEpisode.length === 0 && (
              <p className='text-sm text-muted-foreground text-center py-8'>
                {showHandled ? 'No events detected this season yet.' : 'Nothing waiting for review.'}
              </p>
            )}
            {byEpisode.map(([episodeNumber, episodeAutoEvents]) => {
              const title = episodes?.find((episode) => episode.episodeNumber === episodeNumber)?.title;
              return (
                <section key={episodeNumber} className='flex flex-col gap-2 min-w-0'>
                  <h3 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                    Episode {episodeNumber}{title ? `: ${title}` : ''}
                  </h3>
                  {episodeAutoEvents.map((autoEvent) => (
                    <AutoEventCard
                      key={autoEvent.autoEventId}
                      autoEvent={autoEvent}
                      fresh={fresh.has(autoEvent.autoEventId)}
                      inForm={activeAutoEvent?.autoEventId === autoEvent.autoEventId}
                      scored={autoEvent.status === 'pending' && !!findScoredMatch(autoEvent, scoredEvents)}
                      referenceName={referenceName}
                      onAccept={() => accept(autoEvent)}
                      onDeny={() => updateAutoEvents({ autoEventIds: [autoEvent.autoEventId], action: 'deny' })}
                      onRestore={() => updateAutoEvents({ autoEventIds: [autoEvent.autoEventId], action: 'restore' })} />
                  ))}
                </section>
              );
            })}
          </div>
          <ScrollBar className='py-1' />
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
