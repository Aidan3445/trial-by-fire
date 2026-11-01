'use client';

import { Crown } from 'lucide-react';
import { CROWN_CLASS } from '~/components/sys/donation/donorCrown';
import HideCrownToggle from '~/components/sys/donation/hideCrownToggle';

/**
  * Supporter page in Clerk's Manage account, for donors
  */
export default function SupporterPage() {
  return (
    <div className='flex flex-col gap-4'>
      <h1 className='flex items-center gap-2 text-lg font-bold'>
        <Crown size={20} strokeWidth={2} className={CROWN_CLASS} />
        Supporter
      </h1>
      <p className='text-sm text-muted-foreground border-t pt-4'>
        Thanks for supporting Trial by Fire! Your crown shows next to your name in your leagues.
      </p>
      <HideCrownToggle />
    </div>
  );
}
