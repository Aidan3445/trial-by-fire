import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

export type MemberWithId = {
  memberId: number;
  displayName: string;
  color: string;
  loggedIn: boolean;
  id: number
};

export function useUpdateDraftOrder() {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();

  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: settings } = useLeagueSettings();
  const [locked, setLocked] = useState(true);

  const dbOrder = useMemo(() => {
    if (!leagueMembers?.members) return [];
    const members = leagueMembers.members.map(m => ({ ...m, id: m.memberId }));
    return members.sort((a, b) => (a.draftOrder ?? a.memberId) - (b.draftOrder ?? b.memberId));
  }, [leagueMembers?.members]);

  const [order, setOrder] = useState<MemberWithId[]>([]);

  useEffect(() => {
    if (dbOrder.length > 0) {
      setOrder([...dbOrder]);
    }
  }, [dbOrder]);

  const orderChanged = useMemo(() => {
    if (!dbOrder.length || !order.length || dbOrder.length !== order.length) return false;
    return dbOrder.some((member, index) => member.memberId !== order[index]?.memberId);
  }, [dbOrder, order]);

  const orderLocked =
    locked
    || league?.status !== 'Predraft'
    || (!!settings?.draftDate && Date.now() > settings.draftDate.getTime());

  const handleSubmit = async () => {
    if (!league || !orderChanged || !leagueMembers) return;

    try {
      const response = await putData(`/api/leagues/${league.hash}/draftOrder`, {
        body: { draftOrder: order.map(member => member.memberId) }
      });
      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error saving draft order:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to save draft order');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to save draft order');
        return;
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['leagueMembers', league.hash] }),
        queryClient.invalidateQueries({ queryKey: ['league', league.hash] })
      ]);

      Alert.alert('Success', 'Draft order saved');
      setLocked(true);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save draft order');
    }
  };

  const resetOrder = () => {
    setOrder([...dbOrder]);
  };

  return {
    order,
    setOrder,
    resetOrder,
    orderChanged,
    orderLocked,
    handleSubmit,
    setLocked,
    leagueMembers
  };
}
