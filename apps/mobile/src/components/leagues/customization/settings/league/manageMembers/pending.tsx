import { View, Text, Alert } from 'react-native';
import { UserCheck, UserX } from 'lucide-react-native';
import ColorRow from '~/components/shared/colorRow';
import Button from '~/components/common/button';
import { type PendingLeagueMember, type LeagueMember } from '~/types/leagueMembers';
import { usePendingMembers } from '~/hooks/leagues/query/usePendingMembers';
import { useDeleteMember } from '~/hooks/leagues/mutation/useDeleteMember';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

interface PendingMemberProps {
  member: PendingLeagueMember;
  loggedInMember?: LeagueMember;
}

export default function PendingMember({ member, loggedInMember }: PendingMemberProps) {
  const { admitMember, isAdmitting } = usePendingMembers();
  const { rejectPendingMember, isDeleting } = useDeleteMember();

  const enabled = loggedInMember?.role !== 'Member' && !isAdmitting && !isDeleting;

  const handleAdmitMember = () => {
    if (!enabled) return;

    void (async () => {
      const success = await admitMember(member.memberId);
      if (success) {
        Alert.alert('Success', `${member.displayName} has been admitted to the league.`);
      }
    })();
  };

  const handleRejectMember = () => {
    if (!enabled) return;

    Alert.alert(
      'Reject Member',
      `Are you sure you want to reject ${member.displayName}? They will need to request to join again.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const success = await rejectPendingMember(member.memberId);
              if (success) {
                Alert.alert('Success', `${member.displayName} has been rejected.`);
              }
            })();
          }
        }
      ]
    );
  };

  return (
    <ColorRow color={member.color} className='w-full'>
      <View className='flex-1 flex-row items-center justify-between'>
        <Text className='text-base flex-shrink' numberOfLines={1}>
          {member.displayName}
        </Text>
        <View className='flex-row items-center gap-2'>
          <Button disabled={!enabled} onPress={handleRejectMember}>
            <UserX
              size={20}
              color={enabled ? colors.destructive : colors.mutedForeground}
              className={cn(!enabled && 'opacity-50')} />
          </Button>
          <Button disabled={!enabled} onPress={handleAdmitMember}>
            <UserCheck
              size={20}
              color={enabled ? colors.positive : colors.mutedForeground}
              className={cn(!enabled && 'opacity-50')} />
          </Button>
        </View>
      </View>
    </ColorRow>
  );
}
