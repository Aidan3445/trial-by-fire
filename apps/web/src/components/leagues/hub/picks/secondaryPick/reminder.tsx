'use client';

import { FOCUS_SECONDARY_PICK_EVENT, useSecondaryPick } from '~/hooks/leagues/enrich/useSecondaryPick';

/** Nudges members who haven't made this week's secondary pick, and takes them to it */
export default function SecondaryPickReminder() {
  const { active, loaded, hasPick, nextEpisode } = useSecondaryPick();

  if (!active || !loaded || hasPick || nextEpisode?.airStatus !== 'Upcoming') return null;

  const locks = new Date(nextEpisode.airDate).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  const goToPick = () => {
    document.getElementById('weekly-picks')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.dispatchEvent(new Event(FOCUS_SECONDARY_PICK_EVENT));
  };

  return (
    <div
      role='status'
      className='flex items-center gap-2 rounded-lg border-2 border-amber-400 bg-amber-400/15 px-3 py-2 text-sm'>
      <span className='size-2 shrink-0 rounded-full bg-amber-400' />
      <span className='min-w-0 flex-1'>
        <b>No secondary pick for episode {nextEpisode.episodeNumber}</b>
        <span className='text-muted-foreground'> · locks {locks}</span>
      </span>
      <button
        type='button'
        onClick={goToPick}
        className='shrink-0 font-bold uppercase tracking-wider text-xs text-primary hover:underline cursor-pointer'>
        Pick now
      </button>
    </div>
  );
}
