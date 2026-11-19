import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Recycle, Trash2 } from 'lucide-react-native';
import Button from '~/components/common/button';
import ColorRow from '~/components/shared/colorRow';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useDeleteLeague } from '~/hooks/leagues/mutation/useDeleteLeague';
import { cn } from '~/lib/utils';

/**
 * A league whose season ended before it drafted: who was in it, and for the
 * owner, a way to run it back next season or clear it out.
 */
export default function NeverDrafted() {
  const router = useRouter();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { handleDelete, isSubmitting } = useDeleteLeague(false);

  const isOwner = leagueMembers?.loggedIn?.role === 'Owner';
  const members = useMemo(() =>
    [...(leagueMembers?.members ?? [])].sort((a, b) =>
      (a.draftOrder ?? a.memberId) - (b.draftOrder ?? b.memberId)),
    [leagueMembers?.members]);

  if (!league) return null;

  return (
    <View className='w-full gap-y-4'>
      <View className='w-full rounded-xl bg-card p-3 border-2 border-primary/20 gap-2'>
        <View className='flex-row items-center gap-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            This league never drafted
          </Text>
        </View>
        <Text className='text-base text-muted-foreground'>
          {league.season} ended before the draft.
          {isOwner
            ? ' Clone it to bring everyone into next season, or delete it.'
            : ' Ask the owner to clone it for next season.'}
        </Text>
        {isOwner && (
          <View className='gap-2 pt-1'>
            <Button
              className='flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3'
              onPress={() => router.push({ pathname: '/(modals)/recreate', params: { hash: league.hash } })}>
              <Text className='text-center font-semibold text-white'>Clone for next season</Text>
              <Recycle size={16} color='white' />
            </Button>
            <Button
              className={cn(
                'flex-row items-center justify-center gap-2 rounded-lg bg-destructive p-3',
                isSubmitting && 'opacity-50'
              )}
              disabled={isSubmitting}
              onPress={handleDelete}>
              <Text className='text-center font-semibold text-white'>
                {isSubmitting ? 'Deleting...' : 'Delete league'}
              </Text>
              <Trash2 size={16} color='white' />
            </Button>
          </View>
        )}
      </View>

      <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20'>
        <View className='flex-row items-center gap-1 mb-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Members
          </Text>
        </View>
        {members.map((member, index) => (
          <ColorRow
            key={member.memberId}
            className='mb-2 flex-row items-center rounded-lg px-4'
            color={member.color}>
            <View
              className='w-8 h-8 items-center justify-center rounded-md'
              style={{
                backgroundColor: `${member.color}40`,
                borderWidth: 2,
                borderColor: `${member.color}66`,
              }}>
              <Text className='font-black text-sm'>{index + 1}</Text>
            </View>
            <Text className={cn(
              'ml-4 flex-1 text-xl font-semibold',
              member.loggedIn && 'text-primary'
            )}>
              {member.displayName}
            </Text>
          </ColorRow>
        ))}
      </View>
    </View>
  );
}
