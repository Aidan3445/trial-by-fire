import { View, Text } from 'react-native';
import { type LeagueMember } from '~/types/leagueMembers';
import { useLeaveLeague } from '~/hooks/leagues/mutation/useLeaveLeague';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';

interface LeaveLeagueProps {
  member?: LeagueMember;
}

export default function LeaveLeague({ member }: LeaveLeagueProps) {
  const { isOpen, isOwner, setIsOpen, handleLeaveLeague } = useLeaveLeague(member);

  if (!member?.loggedIn) return null;
  return (
    <>
      <Button
        className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
        onPress={() => setIsOpen(true)}>
        <Text className='text-center font-semibold text-destructive-foreground'>Leave League</Text>
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <View className='gap-4'>
          {/* Header */}
          <View className='flex-row items-center gap-3'>
            <View className='h-6 w-1 rounded-full bg-destructive' />
            <Text className='text-xl font-black uppercase tracking-tight text-destructive'>
              Leave League
            </Text>
          </View>

          {/* Description */}
          <Text className='text-base text-muted-foreground'>
            {isOwner
              ? 'You must transfer ownership to another member before leaving the league.'
              : 'Are you sure you want to leave this league? This action cannot be undone.'}
          </Text>

          {/* Actions */}
          {isOwner ? (
            <Button
              className='rounded-lg bg-muted p-3 active:opacity-80'
              onPress={() => setIsOpen(false)}>
              <Text className='text-center font-semibold text-foreground'>OK</Text>
            </Button>
          ) : (
            <View className='flex-row gap-2'>
              <Button
                className='flex-1 rounded-lg bg-muted p-3 active:opacity-80'
                onPress={() => setIsOpen(false)}>
                <Text className='text-center font-semibold text-foreground'>No, cancel</Text>
              </Button>
              <Button
                className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
                onPress={handleLeaveLeague}>
                <Text className='text-center font-semibold text-destructive-foreground'>
                  Yes, leave
                </Text>
              </Button>
            </View>
          )}
        </View>
      </Modal>
    </>
  );
}
