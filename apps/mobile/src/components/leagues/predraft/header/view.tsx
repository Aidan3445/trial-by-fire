'use client';

import { useRouter } from 'expo-router';
import { ArrowLeft, Settings } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import MarqueeText from '~/components/common/marquee';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { colors } from '~/lib/colors';

interface PredraftHeaderProps {
  inSettings?: boolean;
}

export default function PredraftHeader({ inSettings }: PredraftHeaderProps) {
  const height = useHeaderHeight();
  const { data: league } = useLeague();
  const router = useRouter();
  return (
    <View
      className='absolute top-0 z-10 w-full items-center justify-end bg-card shadow-lg'
      style={{ height }}>
      <View className='items-center justify-center w-full'>
        <View className='relative flex-row items-center justify-center w-full max-w-72'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <MarqueeText
            text={inSettings ? 'League Settings' : league?.name || 'Loading...'}
            center
            allowFontScaling={false}
            className='text-2xl font-black uppercase tracking-tight text-foreground'
            containerClassName='flex-row'
            noMarqueeContainerClassName='w-min px-0.5' />
          <View className='h-6 w-1 bg-primary rounded-full' />
        </View>
        <Button
          className='absolute left-4 px-4'
          onPress={() => {
            if (inSettings) {
              router.back();
            } else {
              if (router.canGoBack()) router.back();
              else router.replace('/leagues');
            }
          }}>
          <Text className='text-lg'>
            <ArrowLeft color={colors.primary} size={24} />
          </Text>
        </Button>

        {!inSettings &&
          (
            <Button
              className='absolute right-4 px-4'
              onPress={() => router.push(`/leagues/${league?.hash}/settings`)}>
              <Settings color={colors.primary} size={24} />
            </Button>
          )}
      </View>
    </View>
  );
}
