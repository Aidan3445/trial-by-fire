import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMember } from '~/types/leagueMembers';

interface UseSkipMemberProps {
  hash: string;
  member: LeagueMember;
  leagueMembers: LeagueMember[];
}

export function useSkipMember({ hash, member, leagueMembers }: UseSkipMemberProps) {
  const queryClient = useQueryClient();
  const putData = useFetch('PUT');

  const updateDraftOrder = async (draftOrder: number[]) => {
    const response = await putData(`/api/leagues/${hash}/draftOrder`, {
      body: { draftOrder },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to update draft order');
    }
    await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });
  };

  const handleSkip = () => {
    void (async () => {
      try {
        const memberToSwap = leagueMembers.find((m) => m.draftOrder === member.draftOrder + 1);
        if (!memberToSwap) {
          Alert.alert('Error', 'Cannot skip, already at the end of the draft order');
          return;
        }

        const draftOrder = leagueMembers
          .map((m) => {
            if (m.memberId === member.memberId) {
              return { memberId: m.memberId, draftOrder: m.draftOrder + 1 };
            }
            if (m.memberId === memberToSwap.memberId) {
              return { memberId: m.memberId, draftOrder: m.draftOrder - 1 };
            }
            return { memberId: m.memberId, draftOrder: m.draftOrder };
          })
          .sort((a, b) => a.draftOrder - b.draftOrder)
          .map((m) => m.memberId);

        await updateDraftOrder(draftOrder);
        Alert.alert('Success', 'Successfully skipped member');
      } catch (error) {
        console.error('Error skipping member:', error);
        Alert.alert('Error', 'Failed to skip member');
      }
    })();
  };

  const handleSendToBack = () => {
    void (async () => {
      try {
        const draftOrder = leagueMembers
          .filter((m) => m.memberId !== member.memberId)
          .map((m) => m.memberId);
        draftOrder.push(member.memberId);

        await updateDraftOrder(draftOrder);
        Alert.alert('Success', 'Successfully sent member to back of the draft order');
      } catch (error) {
        console.error('Error sending member to back:', error);
        Alert.alert('Error', 'Failed to send member to back of the draft order');
      }
    })();
  };

  const isLastInOrder = member.draftOrder >= leagueMembers.length - 1;

  return {
    handleSkip,
    handleSendToBack,
    isLastInOrder,
  };
}
