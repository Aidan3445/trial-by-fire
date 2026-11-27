'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Recycle } from 'lucide-react';
import { Button } from '~/components/common/button';
import requestClone from '~/actions/requestClone';
import { useLeague } from '~/hooks/leagues/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/useLeagueMembers';

/**
  * For members of a league that played last season: ask the owner to clone it
  * for the new season. Hidden until they can ask again.
  */
export default function CloneRequest() {
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const [sending, setSending] = useState(false);

  if (!league?.canRequestClone) return null;
  const owner = leagueMembers?.members.find((member) => member.role === 'Owner');

  const handleRequest = async () => {
    setSending(true);
    try {
      await requestClone(league.hash);
      alert(`We let ${owner?.displayName ?? 'the owner'} know you want to play again.`);
    } catch (e) {
      console.error('Failed to request a clone', e);
      alert('Could not send the request right now.');
    } finally {
      // Hides the button until they can ask again
      await queryClient.invalidateQueries({ queryKey: ['league', league.hash] });
      setSending(false);
    }
  };

  return (
    <div className='flex flex-wrap items-center justify-between gap-2 bg-card rounded-lg p-3 border-2 border-primary/20 shadow-lg shadow-primary/10'>
      <div>
        <h3 className='font-bold'>Want to play again?</h3>
        <p className='text-sm text-muted-foreground'>
          Ask {owner?.displayName ?? 'the owner'} to bring this league back for the new season.
        </p>
      </div>
      <Button disabled={sending} onClick={() => void handleRequest()}>
        {sending ? 'Sending...' : 'Ask to clone'}
        <Recycle className='ml-1' size={16} />
      </Button>
    </div>
  );
}
