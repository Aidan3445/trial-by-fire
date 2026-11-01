'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '~/components/common/button';
import FundingTracker from '~/components/sys/donation/fundingTracker';
import { SEASON_END_EVENT, startDonation, takeDonationPending } from '~/components/sys/donation/startDonation';
import { useDonationStatus, useFunding, useOptOut, useThankDonations } from '~/hooks/user/useFunding';
import { useLeagues } from '~/hooks/user/useLeagues';

const ASKED_SESSION_KEY = 'donation-alert-session';
// After they come back from Buy Me a Coffee, watch for the webhook
const WATCH_POLL_MS = 5000;
const WATCH_MS = 2 * 60 * 1000;

function Overlay({ onDismiss, children }: { onDismiss: () => void; children: ReactNode }) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50' onClick={onDismiss}>
      <div
        className='bg-card rounded-xl p-6 max-w-md w-[calc(100%-2rem)] mx-4 shadow-xl space-y-4 border-2 border-primary/20'
        onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

/**
  * Asks for donations toward running costs once per login, for users with an
  * active league who haven't donated or opted out this season. Thanks them once
  * Buy Me a Coffee tells us about a donation from their email.
  * At the end of a season, thanks league members and asks for next season.
  */
export function DonationManager() {
  const { isSignedIn, sessionId } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: funding, refetch: refetchFunding } = useFunding();
  const { data: status, refetch: refetchStatus } = useDonationStatus();
  const { mutate: markThanked } = useThankDonations();
  const { mutate: optOut } = useOptOut();

  const [view, setView] = useState<'ask' | 'seasonEnd' | 'thanks' | null>(null);
  const [thankedAmount, setThankedAmount] = useState(0);
  const [watching, setWatching] = useState(false);

  const unmet = useMemo(() => funding?.goals.filter((goal) => !goal.fulfilled) ?? [], [funding]);
  const unthanked = status?.unthanked ?? null;

  // Once per login, until they donate or say don’t ask again this season
  useEffect(() => {
    if (!isSignedIn || !sessionId || !funding || !status) return;
    const hasActiveLeague = leagues?.some(({ league }) => league.status === 'Active');
    if (!hasActiveLeague || status.donatedThisSeason || status.optedOut) return;
    try {
      if (localStorage.getItem(ASKED_SESSION_KEY) === sessionId) return;
      localStorage.setItem(ASKED_SESSION_KEY, sessionId);
    } catch {
      // Storage blocked: ask anyway
    }
    setView('ask');
  }, [isSignedIn, sessionId, funding, status, leagues]);

  // A donation from them came in: thank them over anything else, until dismissed
  useEffect(() => {
    if (unthanked === null) return;
    setThankedAmount(unthanked);
    setView('thanks');
    setWatching(false);
    void refetchFunding();
  }, [unthanked, refetchFunding]);

  // Back from Buy Me a Coffee: the webhook may take a moment
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === 'visible' && takeDonationPending()) setWatching(true);
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, []);
  useEffect(() => {
    if (!watching) return;
    void refetchStatus();
    const poll = setInterval(() => void refetchStatus(), WATCH_POLL_MS);
    const stop = setTimeout(() => setWatching(false), WATCH_MS);
    return () => {
      clearInterval(poll);
      clearTimeout(stop);
    };
  }, [watching, refetchStatus]);

  // Podium of a finished season: don't cover up another view
  useEffect(() => {
    const onSeasonEnd = () => setView((current) => current ?? 'seasonEnd');
    window.addEventListener(SEASON_END_EVENT, onSeasonEnd);
    return () => window.removeEventListener(SEASON_END_EVENT, onSeasonEnd);
  }, []);

  if (!view || !funding) return null;
  const close = () => {
    // Shown until dismissed, then never again for these donations
    if (view === 'thanks') markThanked();
    setView(null);
  };
  const topGoal = unmet[0];
  const allCovered = (
    <p className='text-muted-foreground text-sm'>
      Every goal is covered! Any more donations go toward future costs and new features.
    </p>
  );

  if (view === 'thanks') {
    return (
      <Overlay onDismiss={close}>
        <div className='space-y-1'>
          <h2 className='text-lg font-bold'>Thank you!</h2>
          <p className='text-muted-foreground text-sm'>We got your ${thankedAmount} donation. Thanks for supporting Trial by Fire!</p>
          {unmet.length === 0 ? allCovered : <p className='text-muted-foreground text-sm'>Here’s where things stand:</p>}
        </div>
        <FundingTracker goals={funding.goals} />
        <Button className='w-full' onClick={close}>Close</Button>
      </Overlay>
    );
  }

  const [title, body] = view === 'seasonEnd'
    ? ['Thanks for playing this season!',
      'We hope you had fun competing in your league. If you’d like to help keep Trial by Fire running and ad free for next season, would you chip in?']
    : status?.donatedBefore
      ? ['Thanks for your support last season!',
        'Your donation helped keep the app running. If you’re enjoying this season, would you chip in again?']
      : ['Help keep Trial by Fire ad free',
        'We want to keep the app ad free, but the free tiers of the services we use have limits, like short login sessions.'];
  const linkClass = 'cursor-pointer text-muted-foreground text-xs hover:text-foreground transition-colors';
  return (
    <Overlay onDismiss={close}>
      <div className='space-y-2'>
        <h2 className='text-lg font-bold'>{title}</h2>
        <p className='text-muted-foreground text-sm'>{body}</p>
        {topGoal ? <p className='text-muted-foreground text-sm'>{topGoal.description}</p> : allCovered}
      </div>
      <FundingTracker goals={unmet.length > 0 ? unmet : funding.goals} />
      <div className='flex flex-col gap-2'>
        <Button
          className='w-full'
          onClick={() => {
            startDonation();
            close();
          }}>
          Buy me a coffee
        </Button>
        <div className='flex justify-center gap-6 pt-1'>
          <button onClick={close} className={linkClass}>Maybe later</button>
          {view === 'ask' && status?.seasonId != null && (
            <button
              onClick={() => {
                optOut();
                close();
              }}
              className={linkClass}>
              Don’t ask again this season
            </button>
          )}
        </div>
      </div>
    </Overlay>
  );
}
