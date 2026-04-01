import { View, Text, Pressable } from 'react-native';
import { useSkipMember } from '~/hooks/leagues/mutation/useSkipMember';
import { type LeagueMember } from '~/types/leagueMembers';
import { cn } from '~/lib/utils';

interface SkipMemberProps {
  hash: string;
  member: LeagueMember;
  leagueMembers: LeagueMember[];
}

export default function SkipMember({ hash, member, leagueMembers }: SkipMemberProps) {
  const { handleSkip, handleSendToBack, isLastInOrder } = useSkipMember({
    hash,
    member,
    leagueMembers,
  });

  return (
    <View className='flex-row items-center gap-2'>
      <Pressable
        className={cn(
          'rounded-lg border-2 border-primary/20 bg-card px-3 py-2 active:opacity-80',
          isLastInOrder && 'opacity-50'
        )}
        onPress={handleSkip}
        disabled={isLastInOrder}>
        <Text className='text-sm font-bold uppercase tracking-wider text-foreground'>Skip</Text>
      </Pressable>
      <Pressable
        className='rounded-lg bg-destructive px-3 py-2 active:opacity-80'
        onPress={handleSendToBack}>
        <Text className='text-sm font-bold uppercase tracking-wider text-destructive-foreground'>
          Send to Back
        </Text>
      </Pressable>
    </View>
  );
}
