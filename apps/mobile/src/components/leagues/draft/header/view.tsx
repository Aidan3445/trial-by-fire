'use client';

import { useRouter } from 'expo-router';
import { ArrowLeft, Users } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import { useLeague } from '~/hooks/leagues/query/useLeague';

interface DraftHeaderProps {
  inCastawaysView?: boolean;
}

export default function DraftHeader({ inCastawaysView }: DraftHeaderProps) {
  const { data: league } = useLeague();
  const router = useRouter();

  const handleBackPress = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback to direct navigation if no history
      router.replace(`/leagues/${league?.hash}/draft`);
    }
  };

  const handleCastawaysPress = () => {
    router.push(`/castaways?hash=${league?.hash}`);
  };

  return (
    <View className='absolute top-0 z-10 h-24 w-full items-center justify-end bg-secondary pb-2'>
      <Text className='text-2xl font-bold text-white'>{league?.name ?? 'League'} - Draft</Text>
      {inCastawaysView ? (
        <Button
          className='absolute bottom-0 left-4 py-2 px-4'
          onPress={handleBackPress}>
          <ArrowLeft color='white' size={24} />
        </Button>
      ) : (
        <Button
          className='absolute bottom-0 right-4 py-2 px-4'
          onPress={handleCastawaysPress}>
          <Users color='white' size={24} />
        </Button>
      )}
    </View>
  );
}
