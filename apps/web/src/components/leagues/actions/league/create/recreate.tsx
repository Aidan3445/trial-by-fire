'use client';

import { Button } from '~/components/common/button';
import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogPortal, AlertDialogTitle, AlertDialogTrigger } from '~/components/common/alertDialog';
import { useEffect, useMemo, useState } from 'react';
import ColorRow from '~/components/shared/colorRow';
import { getContrastingColor } from '@uiw/color-convert';
import { Recycle } from 'lucide-react';
import { useTargetSeason } from '~/hooks/seasons/useTargetSeason';
import { useCloneOrder } from '~/hooks/leagues/enrich/useCloneOrder';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/common/popover';
import { cn } from '~/lib/utils';
import { PopoverArrow } from '@radix-ui/react-popover';
import recreateLeague from '~/actions/recreateLeague';
import { useRouter } from 'next/navigation';

interface RecreateLeagueProps {
  hash: string;
}

export default function RecreateLeague({ hash }: RecreateLeagueProps) {
  const { cloneOrder, leagueMembers, league } = useCloneOrder(hash);
  const { season: currentSeason } = useTargetSeason(league?.seasonId);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const router = useRouter();

  const ownerLoggedIn = useMemo(() => {
    if (!leagueMembers?.loggedIn) return false;
    return leagueMembers.loggedIn.role === 'Owner';
  }, [leagueMembers]);

  useEffect(() => {
    setSelectedMembers(new Set(cloneOrder.map((member) => member.memberId)));
  }, [cloneOrder]);

  const handleSubmit = async () => {
    try {
      const sortedSelectedMembers = cloneOrder
        .filter((member) => selectedMembers.has(member.memberId))
        .map((member) => member.memberId);
      const { newHash } = await recreateLeague(hash, sortedSelectedMembers);
      alert('League recreated successfully!');
      router.push(`/leagues/${newHash}/predraft`);
    } catch (e) {
      console.error('Failed to recreate league', e);
      alert('An error occurred while recreating the league.');
    }
  };

  return (
    <div onClick={(e) => e.stopPropagation()}>
      {ownerLoggedIn ? (
        <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
          <AlertDialogTrigger asChild>
            <Button
              size='sm'
              variant='default'
              className={cn('mt-1 w-full')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(ownerLoggedIn);
              }}>
              <p className='text-white text-nowrap'>
                Clone League <Recycle className='inline ml-1' size={16} color='white' />
              </p>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogPortal>
            <AlertDialogContent
              className='sm:w-160 w-96 flex flex-col animate-scale-in-fast'>
              <AlertDialogTitle className='text-2xl'>
                Clone League
                {currentSeason && (
                  <div className='text-sm text-muted-foreground'>
                    {currentSeason.name}
                  </div>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                Do you want all members to be added again?
                <br />
                Selected members will automatically be added to the new league.
              </AlertDialogDescription>
              <form className='space-y-2' action={handleSubmit}>
                {cloneOrder.map((member) => (
                  <ColorRow key={member.memberId} color={member.color}>
                    <input
                      type='checkbox'
                      id={`member-${member.memberId}`}
                      defaultChecked
                      className='h-4 w-4'
                      disabled={member.loggedIn}
                      onChange={(e) => {
                        if (member.loggedIn) return;
                        const newSelectedMembers = new Set(selectedMembers);
                        if (e.target.checked) {
                          newSelectedMembers.add(member.memberId);
                        } else {
                          newSelectedMembers.delete(member.memberId);
                        }
                        setSelectedMembers(newSelectedMembers);
                      }}
                    />
                    <label
                      htmlFor={`member-${member.memberId}`}
                      className='text-sm'
                      style={{ color: getContrastingColor(member.color) }}>
                      {member.displayName}
                    </label>
                  </ColorRow>
                ))}
                <p className='mr-auto text-xs text-muted-foreground'>
                  The default draft order will start from the losers of the previous season.
                  <br />
                  You can change this later.
                </p>
                <div className='flex justify-end space-x-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsOpen(false)}>
                    Cancel
                  </Button>
                  <Button type='submit' disabled={selectedMembers.size === 0}>
                    Clone
                  </Button>
                </div>
              </form>
            </AlertDialogContent>
          </AlertDialogPortal>
        </AlertDialog>
      ) : (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              size='sm'
              variant='default'
              className={cn('mt-1 w-full opacity-50 cursor-help')}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
              }}>
              <p className='text-white text-nowrap'>
                Clone League <Recycle className='inline ml-1' size={16} color='white' />
              </p>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-48'>
            <PopoverArrow />
            Only the league owner can recreate a league.
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
} 
