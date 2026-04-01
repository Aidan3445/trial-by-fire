import { useState } from 'react';
import { View, Text, Switch, Alert, Platform } from 'react-native';
import { Crown } from 'lucide-react-native';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import ColorRow from '~/components/shared/colorRow';
import { useMemberRole } from '~/hooks/leagues/mutation/useMemberRole';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type CurrentMemberProps } from '~/components/leagues/customization/settings/league/manageMembers/current';

export default function OwnerToggle({ member, loggedInMember }: CurrentMemberProps) {
  const { updateRole, isSubmitting } = useMemberRole();
  const [isOpen, setIsOpen] = useState(false);
  const [iUnderstand, setIUnderstand] = useState(false);

  const enabled =
    loggedInMember?.role === 'Owner' &&
    loggedInMember?.memberId !== member.memberId &&
    !isSubmitting;
  const isOwner = member.role === 'Owner';

  const handleToggleOwner = () => {
    if (!iUnderstand) return;

    void (async () => {
      const success = await updateRole(member.memberId, 'Owner');
      if (success) {
        Alert.alert('Success', `${member.displayName} is now the Owner.`);
        setIsOpen(false);
        setIUnderstand(false);
      }
    })();
  };

  const handleClose = () => {
    setIsOpen(false);
    setIUnderstand(false);
  };

  return (
    <>
      <Button disabled={!enabled} onPress={() => setIsOpen(true)}>
        <Crown
          size={20}
          color={enabled ? colors.foreground : colors.mutedForeground}
          fill={isOwner ? colors.foreground : 'none'}
          className={cn(!enabled && 'opacity-50')} />
      </Button>

      <Modal visible={isOpen} onClose={handleClose}>
        <View className='flex-row items-center gap-1 mb-2'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Transfer Ownership
          </Text>
        </View>

        <Text className='text-base text-foreground mb-4'>
          Are you sure you want to make{' '}
          <View className={cn(Platform.OS === 'ios' ? 'translate-y-4' : 'translate-y-2')}>
            <ColorRow color={member.color} className='px-1'>
              <Text className='font-medium'>{member.displayName}</Text>
            </ColorRow>
          </View>{' '}
          the new <Text className='font-bold'>Owner</Text> of this league? This action cannot be
          undone.
        </Text>

        <View className='flex-row items-center gap-2 mb-4 p-2 rounded-lg bg-destructive/10'>
          <Switch
            value={iUnderstand}
            onValueChange={setIUnderstand}
            trackColor={{ false: colors.destructive, true: colors.destructive }}
            thumbColor='white' />
          <Text className='flex-1 text-sm text-muted-foreground'>
            I understand that this will transfer ownership rights to this member and only they will
            be able to undo this action.
          </Text>
        </View>

        <View className='flex-row gap-2'>
          <Button
            className='flex-1 rounded-lg bg-muted p-3 active:opacity-80'
            onPress={handleClose}>
            <Text className='text-center font-semibold text-foreground'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              (!iUnderstand || isSubmitting) && 'opacity-50'
            )}
            disabled={!iUnderstand || isSubmitting}
            onPress={handleToggleOwner}>
            <Text className='text-center font-semibold text-white'>
              {isSubmitting ? 'Transferring...' : 'Transfer Ownership'}
            </Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}
