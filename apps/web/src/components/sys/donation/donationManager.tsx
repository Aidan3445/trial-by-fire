'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '~/components/common/button';
import { Input } from '~/components/common/input';
import FundingTracker from '~/components/sys/donation/fundingTracker';
import { startDonation, takeDonationPending } from '~/components/sys/donation/startDonation';
import { useDonationStatus, useFunding, useReportDonation } from '~/hooks/user/useFunding';
import { useLeagues } from '~/hooks/user/useLeagues';

const ASKED_SESSION_KEY = 'donation-alert-session';
const QUICK_AMOUNTS = [3, 5, 10];

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
  * active league who haven't donated this season. When someone comes back from
  * Buy Me a Coffee, asks whether they donated and shows what's covered.
  */
export function DonationManager() {
  const { isSignedIn, sessionId } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: funding } = useFunding();
  const { data: status } = useDonationStatus();
  const report = useReportDonation();
  const { reset: resetReport } = report;

  const [view, setView] = useState<'ask' | 'report' | null>(null);
  const [amount, setAmount] = useState('');
  const [fundingId, setFundingId] = useState<number | null>(null);

  const unmet = useMemo(() => funding?.goals.filter((goal) => !goal.fulfilled) ?? [], [funding]);

  // Once per login, until they report a donation this season
  useEffect(() => {
    if (!isSignedIn || !sessionId || !funding || !status) return;
    const hasActiveLeague = leagues?.some(({ league }) => league.status === 'Active');
    if (!hasActiveLeague || unmet.length === 0 || status.donatedThisSeason) return;
    try {
      if (localStorage.getItem(ASKED_SESSION_KEY) === sessionId) return;
      localStorage.setItem(ASKED_SESSION_KEY, sessionId);
    } catch {
      // Storage blocked: ask anyway
    }
    setView('ask');
  }, [isSignedIn, sessionId, funding, status, leagues, unmet.length]);

  // Back from Buy Me a Coffee: ask how it went
  useEffect(() => {
    const onReturn = () => {
      if (document.visibilityState === 'visible' && takeDonationPending()) {
        resetReport();
        setAmount('');
        setView('report');
      }
    };
    document.addEventListener('visibilitychange', onReturn);
    window.addEventListener('focus', onReturn);
    return () => {
      document.removeEventListener('visibilitychange', onReturn);
      window.removeEventListener('focus', onReturn);
    };
  }, [resetReport]);

  if (!view || !funding) return null;
  const close = () => setView(null);
  const topGoal = unmet[0] ?? funding.goals[0];

  if (view === 'ask') {
    return (
      <Overlay onDismiss={close}>
        <div className='space-y-2'>
          <h2 className='text-lg font-bold'>
            {status?.donatedBefore ? 'Thanks for your support last season!' : 'Help keep Trial by Fire ad free'}
          </h2>
          <p className='text-muted-foreground text-sm'>
            {status?.donatedBefore
              ? 'Your donation helped keep the app running. If you’re enjoying this season, would you chip in again?'
              : 'We want to keep the app ad free, but the free tiers of the services we use have limits, like short login sessions.'}
          </p>
          {topGoal && <p className='text-muted-foreground text-sm'>{topGoal.description}</p>}
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
          <button
            onClick={close}
            className='cursor-pointer text-muted-foreground text-xs text-center hover:text-foreground transition-colors pt-1'>
            Maybe later
          </button>
        </div>
      </Overlay>
    );
  }

  const value = Number(amount);
  const validAmount = Number.isFinite(value) && value > 0 && value <= 1000;
  const chooseGoal = unmet.length > 1;
  const chosenGoal = chooseGoal ? (fundingId ?? unmet[0]!.fundingId) : undefined;

  if (report.isSuccess) {
    return (
      <Overlay onDismiss={close}>
        <div className='space-y-1'>
          <h2 className='text-lg font-bold'>Thank you!</h2>
          <p className='text-muted-foreground text-sm'>Here’s where things stand:</p>
        </div>
        <FundingTracker goals={funding.goals} />
        <Button className='w-full' onClick={close}>Close</Button>
      </Overlay>
    );
  }

  return (
    <Overlay onDismiss={close}>
      <div className='space-y-1'>
        <h2 className='text-lg font-bold'>Thanks for stopping by!</h2>
        <p className='text-muted-foreground text-sm'>Did you donate? Let us know how much so we can track what’s covered.</p>
      </div>
      <div className='flex items-center gap-2'>
        {QUICK_AMOUNTS.map((quick) => (
          <Button
            key={quick}
            type='button'
            size='sm'
            variant={value === quick ? 'default' : 'outline'}
            onClick={() => setAmount(`${quick}`)}>
            ${quick}
          </Button>
        ))}
        <span className='relative flex-1'>
          <span className='absolute left-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground'>$</span>
          <Input
            type='number'
            inputMode='decimal'
            min={0}
            step='0.01'
            placeholder='Other'
            className='pl-5'
            value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </span>
      </div>
      {chooseGoal && (
        <fieldset className='space-y-1'>
          <legend className='text-sm font-bold'>Where should it go?</legend>
          {unmet.map((goal) => (
            <label key={goal.fundingId} className='flex items-center gap-2 text-sm cursor-pointer'>
              <input
                type='radio'
                name='funding-goal'
                checked={chosenGoal === goal.fundingId}
                onChange={() => setFundingId(goal.fundingId)} />
              {goal.name}
            </label>
          ))}
        </fieldset>
      )}
      <FundingTracker goals={funding.goals} />
      {report.isError && <p className='text-sm text-destructive'>{report.error.message}</p>}
      <div className='flex flex-col gap-2'>
        <Button
          className='w-full'
          disabled={!validAmount || report.isPending}
          onClick={() => report.mutate({ amount: value, fundingId: chosenGoal })}>
          {report.isPending ? 'Saving...' : validAmount ? `I donated $${value}` : 'I donated'}
        </Button>
        <button
          onClick={close}
          className='cursor-pointer text-muted-foreground text-xs text-center hover:text-foreground transition-colors pt-1'>
          I didn’t donate
        </button>
      </div>
    </Overlay>
  );
}
