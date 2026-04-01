import { Copy, Share, Check } from 'lucide-react-native';
import { Text, View, Alert, Share as RNShare, Pressable } from 'react-native';
import { useState } from 'react';
import { cn } from '~/lib/utils';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import * as Clipboard from 'expo-clipboard';
import { colors } from '~/lib/colors';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import ProtectionInfo from '~/components/leagues/predraft/inviteLink/protectionInfo';

const BASE_URL = 'https://trialbyfiresurvivor.com';
//process.env.EXPO_PUBLIC_API_URL;
if (!BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_URL is not set');
}

export default function InviteLink() {
  const { data: league } = useLeague();
  const { data: leagueSettings } = useLeagueSettings();
  const [hasCopied, setHasCopied] = useState(false);

  if (!league) return null;

  const link = `${BASE_URL}/i/${league.hash}`;

  const copyLink = async () => {
    await Clipboard.setStringAsync(link);
    setHasCopied(true);
    Alert.alert('Success', 'Link copied to clipboard');
    // eslint-disable-next-line no-undef
    setTimeout(() => setHasCopied(false), 2000);
  };

  const shareLink = async () => {
    try {
      await RNShare.share({
        message: `Join ${league.name} on Fantasy Survivor! ${link}`,
        url: link,
        title: `Join ${league.name}!`
      });
    } catch (error) {
      console.error('Error sharing:', error);
      await copyLink();
    }
  };

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      <View className='flex-row items-center gap-1 h-8'>
        <View className='h-6 w-1 bg-primary rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight'>
          Invite Friends
        </Text>
      </View>

      <Text className='text-base text-muted-foreground leading-none'>
        Grow your league by inviting friends to join
      </Text>

      <View className='flex-row gap-2'>
        <Pressable
          className={cn(
            'flex-1 flex-row items-center justify-center gap-2 rounded-lg p-2 active:opacity-80',
            hasCopied ? 'bg-green-500/20' : 'bg-secondary'
          )}
          onPress={copyLink}>
          {hasCopied ? (
            <Check size={20} color={colors.positive} />
          ) : (
            <Copy size={20} color='white' />
          )}
          <Text className={cn(
            'font-semibold',
            hasCopied ? 'text-positive' : 'text-white'
          )}>
            {hasCopied ? 'Copied!' : 'Copy Link'}
          </Text>
        </Pressable>

        <Pressable
          className='flex-1 flex-row items-center justify-center gap-2 rounded-lg bg-primary p-2 active:opacity-80'
          onPress={shareLink}>
          <Share size={20} color='white' />
          <Text className='font-semibold text-white'>
            Share
          </Text>
        </Pressable>
      </View>
      <ProtectionInfo isProtected={leagueSettings?.isProtected} />
    </View>
  );
}
