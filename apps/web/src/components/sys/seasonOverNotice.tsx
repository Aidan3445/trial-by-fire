'use client';
import { useEffect, useState } from 'react';
import { Button } from '~/components/common/button';

const APP_STORE_URL = 'https://apps.apple.com/app/id6759011635';

let dismissedThisSession = false;

export function SeasonOverNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (dismissedThisSession) return;
    setShow(true);
  }, []);

  const handleDownload = () => {
    window.open(APP_STORE_URL, '_blank');
    dismissedThisSession = true;
    setShow(false);
  };

  const handleDismiss = () => {
    dismissedThisSession = true;
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50'>
      <div className='bg-card rounded-xl p-6 max-w-md mx-4 shadow-xl space-y-4 border-2 border-primary/20'>
        <div className='space-y-1'>
          <h2 className='text-lg font-bold'>Thanks for playing Survivor 50 with us!</h2>
          <p className='text-muted-foreground text-sm'>
            Check back later to create your league for Season 51 this fall.
          </p>
        </div>
        <div className='flex flex-col gap-2'>
          <Button onClick={handleDownload} className='w-full'>
            Download our app to get notified when Season 51 is live
          </Button>
          <button
            onClick={handleDismiss}
            className='cursor-pointer text-muted-foreground text-xs text-center hover:text-foreground transition-colors pt-1'>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
