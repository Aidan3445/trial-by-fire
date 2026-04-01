'use client';

import { SignInButton } from '@clerk/nextjs';
import { Button } from '~/components/common/button';
import { LeaguesIcon } from '~/components/icons/generated';

export function SignInCTA() {
  return (
    <SignInButton mode='modal'>
      <Button size='lg' className='group relative px-8 py-0! bg-primary font-bold overflow-hidden shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all hover:scale-[1.02] active:scale-[0.98]'>
        Survivors ready...GO!
        <LeaguesIcon strokeWidth={0.25} className='fill-primary-foreground stroke-primary-foreground' />
        <div className='absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
      </Button>
    </SignInButton>
  );
}
