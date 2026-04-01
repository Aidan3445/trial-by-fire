'use client';

import { useRouter, useSegments } from 'expo-router';
import { ArrowLeft, HelpCircle } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { HeaderButton } from '~/components/leagues/shared/header/button';
import { useAnimatedVisibility } from '~/hooks/ui/useAnimatedVisibility';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';

export default function ProfileHeader() {
  const router = useRouter();
  const segments = useSegments();
  const height = useHeaderHeight();

  const showBack = segments.includes('account');
  const backOpacity = useAnimatedVisibility(showBack);
  const helpOpacity = useAnimatedVisibility(true);

  return (
    <View
      className='absolute top-0 z-10 w-full items-center justify-end bg-card shadow-lg'
      style={{ height }}>
      <View className='items-center justify-center w-full'>
        <View className='relative flex-row items-center justify-center gap-0.5 w-full'>
          <HeaderButton
            icon={ArrowLeft}
            position='left'
            enabled={showBack}
            opacity={backOpacity}
            onPress={() => router.back()} />
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text
            allowFontScaling={false}
            className='text-2xl font-black uppercase tracking-tight text-foreground'>
            Profile
          </Text>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <HeaderButton
            icon={HelpCircle}
            position='right'
            onPress={() => router.push('/tutorial')}
            opacity={helpOpacity}
            enabled={true} />
        </View>
      </View>
    </View>
  );
}

