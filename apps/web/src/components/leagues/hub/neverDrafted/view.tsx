'use client';

import { Card, CardContent, CardHeader } from '~/components/common/card';
import DeleteLeague from '~/components/leagues/actions/league/delete/view';
import RecreateLeague from '~/components/leagues/actions/league/create/recreate';
import ColorRow from '~/components/shared/colorRow';
import { useLeague } from '~/hooks/leagues/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/useLeagueMembers';
import { cn } from '~/lib/utils';

/**
  * For a league whose season ended before it drafted: who joined, and for the
  * owner, a way to clone it into next season or delete it
  */
export default function NeverDrafted() {
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();

  if (!league || !leagueMembers) return null;
  const isOwner = leagueMembers.loggedIn?.role === 'Owner';

  return (
    <div className='flex flex-col gap-4 w-full max-w-xl mx-auto pt-4'>
      <Card className='border-2 border-primary/20 shadow-lg shadow-primary/10'>
        <CardHeader className='flex flex-col items-start gap-1 px-4'>
          <span className='flex items-center gap-3 h-8'>
            <span className='h-4 md:h-6 w-1 bg-primary rounded-full' />
            <h2 className='md:text-xl font-black uppercase tracking-tight leading-none'>
              This league never drafted
            </h2>
          </span>
          <p className='text-sm text-muted-foreground'>
            {league.season} ended before the draft.
            {isOwner
              ? ' Clone it to bring everyone into next season, or delete it.'
              : ' Ask the owner to clone it for next season.'}
          </p>
        </CardHeader>
        <CardContent className='flex flex-col gap-1 px-4 pb-4'>
          {leagueMembers.members.map((member, index) => (
            <ColorRow
              key={member.memberId}
              color={member.color}
              loggedIn={member.loggedIn}
              className='px-2 gap-2'>
              <span className='w-5 text-xs font-bold text-muted-foreground'>
                {index + 1}
              </span>
              <span className={cn('text-sm font-semibold truncate', member.loggedIn && 'font-black')}>
                {member.displayName}
              </span>
            </ColorRow>
          ))}
          {isOwner && <RecreateLeague hash={league.hash} />}
        </CardContent>
      </Card>
      <DeleteLeague />
    </div>
  );
}
