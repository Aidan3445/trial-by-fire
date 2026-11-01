'use client';

import { Crown } from 'lucide-react';
import { PopoverArrow } from '@radix-ui/react-popover';
import { Button } from '~/components/common/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/common/popover';
import HideCrownToggle from '~/components/sys/donation/hideCrownToggle';
import { startDonation } from '~/components/sys/donation/startDonation';

export const CROWN_CLASS = 'fill-yellow-500 stroke-primary';

/**
  * Crown in the corner of a donor's color row. Thanks the donor, or invites others to donate.
  * @param self Whether the donor is the signed in user
  */
export default function DonorCrown({ self }: { self?: boolean }) {
  return (
    <span className='absolute -top-2.5 -right-2 rotate-30'>
      <Popover>
        <PopoverTrigger asChild>
          <button type='button' aria-label='Supporter' onClick={(e) => e.stopPropagation()}>
            <Crown size={16} strokeWidth={2} className={CROWN_CLASS} />
          </button>
        </PopoverTrigger>
        <PopoverContent className='w-64 p-3 border-2 border-primary/20 shadow-lg shadow-primary/20' side='top'>
          <PopoverArrow className='fill-border' />
          {self ? (
            <div className='flex flex-col items-center gap-2 text-center'>
              <Crown size={36} strokeWidth={1.5} className={CROWN_CLASS} />
              <h3 className='font-bold text-primary'>Thank you for supporting Trial by Fire!</h3>
              <p className='text-sm text-muted-foreground'>
                Your crown shows everyone in your leagues that you helped keep the app ad free.
              </p>
              <HideCrownToggle className='w-full border-t border-primary/20 pt-2' />
            </div>
          ) : (
            <div className='flex flex-col gap-2'>
              <span className='flex items-center gap-1.5 font-bold text-primary'>
                <Crown size={16} strokeWidth={2} className={CROWN_CLASS} />
                Supporter
              </span>
              <p className='text-sm text-muted-foreground'>They donated to help keep Trial by Fire ad free.</p>
              <Button className='w-full' onClick={startDonation}>Buy me a coffee</Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </span>
  );
}
