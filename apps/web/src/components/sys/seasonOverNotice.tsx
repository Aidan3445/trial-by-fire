'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { Button } from '~/components/common/button';
import { useOffseason } from '~/hooks/user/useOffseason';
import { type OffseasonStatus } from '~/types/survey';

const SHOWN_SESSION_KEY = 'season-over-notice-session';

const TITLES: Record<OffseasonStatus['history'], (_season: string) => string> = {
  played: (season) => `Thanks for playing ${season}!`,
  unstarted: () => 'Welcome back!',
  none: () => 'Welcome to Trial by Fire!',
};

/**
  * Once per login, starting a week after the finale and until the next cast is
  * out: the season is over, check back closer to the premiere
  */
export function SeasonOverNotice() {
  const { sessionId } = useAuth();
  const { data: offseason } = useOffseason();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!sessionId || !offseason?.showNotice) return;
    try {
      if (localStorage.getItem(SHOWN_SESSION_KEY) === sessionId) return;
      localStorage.setItem(SHOWN_SESSION_KEY, sessionId);
    } catch {
      // Storage blocked: show it anyway
    }
    setShow(true);
  }, [sessionId, offseason?.showNotice]);

  if (!show || !offseason?.endedSeason) return null;
  const { endedSeason, nextSeason, history } = offseason;
  const premiere = nextSeason
    ? new Date(nextSeason.premiereDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;
  const close = () => setShow(false);

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={close}>
      <div
        className='bg-card rounded-xl p-6 max-w-md w-[calc(100%-2rem)] mx-4 shadow-xl space-y-4 border-2 border-primary/20'
        onClick={(e) => e.stopPropagation()}>
        <div className='space-y-2'>
          <h2 className='text-lg font-bold'>{TITLES[history](endedSeason.name)}</h2>
          <p className='text-muted-foreground text-sm'>
            {endedSeason.name} is over.{' '}
            {nextSeason && premiere
              ? `${nextSeason.name} premieres ${premiere}, so check back closer to then.`
              : 'Check back closer to next season’s premiere.'}
          </p>
          {nextSeason && (
            <p className='text-muted-foreground text-sm'>
              Can’t wait? You can already start a league and invite friends.
            </p>
          )}
        </div>
        <div className='flex flex-col gap-2'>
          <Button className='w-full' onClick={close}>Got it</Button>
          {nextSeason && (
            <Link
              href='/leagues'
              onClick={close}
              className='text-muted-foreground text-xs text-center hover:text-foreground transition-colors pt-1'>
              Go to my leagues
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
