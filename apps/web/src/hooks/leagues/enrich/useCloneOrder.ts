import { useMemo } from 'react';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';

/**
  * Members of a league in their draft order for a clone: last place picks first.
  * Members without scores (as in a league that never drafted) keep their old
  * draft order, ahead of everyone else.
  * @param hash The league being cloned
  * @returnObj `{ cloneOrder, league }`
  */
export function useCloneOrder(hash: string) {
  const { sortedMemberScores, leagueMembers, league } = useLeagueData(hash);
  const cloneOrder = useMemo(() => {
    const scored = sortedMemberScores.toReversed().map(({ member }) => member);
    const unscored = (leagueMembers?.members ?? [])
      .filter((member) => !scored.some((s) => s.memberId === member.memberId));
    return [...unscored, ...scored];
  }, [sortedMemberScores, leagueMembers?.members]);
  return { cloneOrder, league, leagueMembers };
}
