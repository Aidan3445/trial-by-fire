'use client';

import { useEffect, useState } from 'react';
import { AlertDialogDescription } from '~/components/common/alertDialog';
import { ScrollArea, ScrollBar } from '~/components/common/scrollArea';
import { Button } from '~/components/common/button';
import ColorRow from '~/components/shared/colorRow';
import { useTargetSeason } from '~/hooks/seasons/useTargetSeason';
import { useCloneOrder } from '~/hooks/leagues/enrich/useCloneOrder';
import { useRouter } from 'next/navigation';
import recreateLeague from '~/actions/recreateLeague';

interface ChooseMembersProps {
  hash: string;
  onSuccess: () => void;
}

export default function ChooseMembers({ hash, onSuccess }: ChooseMembersProps) {
  const { cloneOrder, league } = useCloneOrder(hash);
  // Clones go in the next unfinished season after the original's
  const { season: currentSeason } = useTargetSeason(league?.seasonId);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setSelectedMembers(new Set(cloneOrder.map((member) => member.memberId)));
  }, [cloneOrder]);

  const toggleMember = (memberId: number, isLoggedIn: boolean) => {
    if (isLoggedIn) return;
    setSelectedMembers((prev) => {
      const next = new Set(prev);
      if (next.has(memberId)) next.delete(memberId);
      else next.add(memberId);
      return next;
    });
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const sortedSelectedMembers = cloneOrder
        .filter((member) => selectedMembers.has(member.memberId))
        .map((member) => member.memberId);

      const { newHash } = await recreateLeague(hash, sortedSelectedMembers);
      alert('League cloned successfully!');
      onSuccess();
      router.push(`/leagues/${newHash}/predraft`);
    } catch (e) {
      console.error('Failed to clone league', e);
      alert('An error occurred while cloning the league.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AlertDialogDescription className='text-base text-left mb-4'>
        Choose which members to bring into the new league.
        {currentSeason && (
          <span className='block text-sm text-muted-foreground mt-1'>
            {currentSeason.name}
          </span>
        )}
      </AlertDialogDescription>
      <ScrollArea className='min-h-[40svh]'>
        <p className='text-xs text-muted-foreground mb-3'>
          The default draft order will start from the losers of the previous season.
          You can change this later.
        </p>
        <div className='space-y-2'>
          {cloneOrder.map((member) => (
            <ColorRow key={member.memberId} color={member.color}>
              <input
                type='checkbox'
                id={`member-${member.memberId}`}
                checked={selectedMembers.has(member.memberId)}
                className='h-4 w-4'
                disabled={member.loggedIn}
                onChange={() => toggleMember(member.memberId, member.loggedIn)} />
              <label htmlFor={`member-${member.memberId}`} className='text-sm cursor-pointer'>
                {member.displayName}
              </label>
            </ColorRow>
          ))}
        </div>
        <ScrollBar orientation='vertical' forceMount />
      </ScrollArea>
      <Button
        className='m-4 mt-auto w-80 self-center font-bold uppercase text-xs tracking-wider shadow-lg hover:shadow-xl transition-all'
        disabled={selectedMembers.size === 0 || isSubmitting}
        onClick={handleSubmit}>
        {isSubmitting ? 'Cloning...' : 'Clone League'}
      </Button>
    </>
  );
}
