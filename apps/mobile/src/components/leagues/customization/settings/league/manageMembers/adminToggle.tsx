import { useState } from 'react';
import { View, Text, Alert, Platform } from 'react-native';
import { Shield } from 'lucide-react-native';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import ColorRow from '~/components/shared/colorRow';
import { useMemberRole } from '~/hooks/leagues/mutation/useMemberRole';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type CurrentMemberProps } from '~/components/leagues/customization/settings/league/manageMembers/current';

export default function AdminToggle({ member, loggedInMember }: CurrentMemberProps) {
  const { updateRole, isSubmitting } = useMemberRole();
  const [isOpen, setIsOpen] = useState(false);

  const enabled =
    loggedInMember?.role === 'Owner' &&
    loggedInMember?.memberId !== member.memberId &&
    !isSubmitting;
  const isAdmin = member.role === 'Admin';

  const handleToggleAdmin = () => {
    void (async () => {
      const success = await updateRole(member.memberId, isAdmin ? 'Member' : 'Admin');
      if (success) {
        Alert.alert('Success', `${member.displayName} is now ${isAdmin ? 'a Member' : 'an Admin'}.`);
        setIsOpen(false);
      }
    })();
  };

  return (
    <>
      <Button disabled={!enabled} onPress={() => setIsOpen(true)}>
        <Shield
          size={20}
          color={enabled ? colors.foreground : colors.mutedForeground}
          fill={isAdmin ? colors.foreground : 'none'}
          className={cn(!enabled && 'opacity-50')} />
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <View className='flex-row items-center gap-1 mb-2'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            {isAdmin ? 'Demote to Member' : 'Promote to Admin'}
          </Text>
        </View>

        <Text className='text-base text-foreground mb-4'>
          Are you sure you want to {isAdmin ? 'demote' : 'promote'}{' '}
          <View className={cn(Platform.OS === 'ios' ? 'translate-y-4' : 'translate-y-2')}>
            <ColorRow color={member.color} className='px-1'>
              <Text className='font-medium'>{member.displayName}</Text>
            </ColorRow>
          </View>{' '}
          to <Text className='font-bold'>{isAdmin ? 'Member' : 'Admin'}</Text>?
        </Text>

        <View className='flex-row gap-2'>
          <Button
            className='flex-1 rounded-lg bg-muted p-3 active:opacity-80'
            onPress={() => setIsOpen(false)}>
            <Text className='text-center font-semibold text-foreground'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              isSubmitting && 'opacity-50'
            )}
            disabled={isSubmitting}
            onPress={handleToggleAdmin}>
            <Text className='text-center font-semibold text-white'>
              {isSubmitting ? 'Updating...' : `Yes, ${isAdmin ? 'demote' : 'promote'}`}
            </Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}
