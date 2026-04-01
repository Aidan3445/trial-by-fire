import { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { Ban } from 'lucide-react-native';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import ColorRow from '~/components/shared/colorRow';
import { useDeleteMember } from '~/hooks/leagues/mutation/useDeleteMember';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type CurrentMemberProps } from '~/components/leagues/customization/settings/league/manageMembers/current';

export default function RemoveMember({ member, loggedInMember }: CurrentMemberProps) {
  const { deleteMember, isDeleting } = useDeleteMember();
  const [isOpen, setIsOpen] = useState(false);

  // Owner can remove anyone except themselves, Admin can remove regular Members only
  const enabled =
    loggedInMember?.memberId !== member.memberId &&
    (loggedInMember?.role === 'Owner' ||
      (loggedInMember?.role === 'Admin' && member.role === 'Member')) &&
    !isDeleting;

  const handleRemoveMember = () => {
    void (async () => {
      const success = await deleteMember(member.memberId);
      if (success) {
        Alert.alert('Success', `${member.displayName} has been removed from the league.`);
        setIsOpen(false);
      }
    })();
  };

  return (
    <>
      <Button disabled={!enabled} onPress={() => setIsOpen(true)}>
        <Ban
          size={20}
          color={enabled ? colors.destructive : colors.mutedForeground}
          className={cn(!enabled && 'opacity-50')} />
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <View className='flex-row items-center gap-1 mb-2'>
          <View className='h-6 w-1 bg-destructive rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight text-destructive'>
            Remove Member
          </Text>
        </View>

        <Text className='text-base text-foreground mb-4'>
          Are you sure you want to remove{' '}
          <View className='translate-y-4'>
            <ColorRow color={member.color} className='px-1'>
              <Text className='font-medium'>{member.displayName}</Text>
            </ColorRow>
          </View>{' '}
          from this league? This action cannot be undone.
        </Text>

        <View className='flex-row gap-2'>
          <Button
            className='flex-1 rounded-lg bg-muted p-3 active:opacity-80'
            onPress={() => setIsOpen(false)}>
            <Text className='text-center font-semibold text-foreground'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-destructive p-3 active:opacity-80',
              isDeleting && 'opacity-50'
            )}
            disabled={isDeleting}
            onPress={handleRemoveMember}>
            <Text className='text-center font-semibold text-white'>
              {isDeleting ? 'Removing...' : 'Yes, remove'}
            </Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}
