import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Recycle } from 'lucide-react-native';
import Button from '~/components/common/button';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { cn } from '~/lib/utils';

/**
 * For members of a league that played last season: ask the owner to clone it
 * for the new season. Hidden until they can ask again.
 */
export default function CloneRequest() {
  const queryClient = useQueryClient();
  const postData = useFetch('POST');
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const [sending, setSending] = useState(false);

  if (!league?.canRequestClone) return null;
  const ownerName = leagueMembers?.members.find((member) => member.role === 'Owner')?.displayName ?? 'the owner';

  const handleRequest = async () => {
    setSending(true);
    try {
      const res = await postData(`/api/leagues/${league.hash}/cloneRequest`);
      if (!res.ok) throw new Error(`Clone request failed: ${res.status}`);
      Alert.alert('Request sent', `We let ${ownerName} know you want to play again.`);
    } catch (e) {
      console.error('Failed to request a clone', e);
      Alert.alert('Error', 'Could not send the request right now.');
    } finally {
      // Hides the button until they can ask again
      await queryClient.invalidateQueries({ queryKey: ['league', league.hash] });
      setSending(false);
    }
  };

  return (
    <View className='w-full gap-2 rounded-xl border-2 border-primary/20 bg-card p-3'>
      <View className='gap-0.5'>
        <Text className='text-lg font-bold text-foreground'>Want to play again?</Text>
        <Text className='text-sm text-muted-foreground'>
          Ask {ownerName} to bring this league back for the new season.
        </Text>
      </View>
      <Button
        className={cn('flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3', sending && 'opacity-50')}
        disabled={sending}
        onPress={() => void handleRequest()}>
        <Text className='font-semibold text-white'>{sending ? 'Sending...' : 'Ask to clone'}</Text>
        <Recycle size={16} color='white' />
      </Button>
    </View>
  );
}
