'use client';
import { Platform, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import Button from '~/components/common/button';

export default function DraftCastawaysHeader() {
  const router = useRouter();
  const height = useHeaderHeight(Platform.OS === 'ios' ? 0 : undefined);

  return (
    <View
      className={cn(
        'absolute top-0 z-10 w-full items-center bg-card shadow-lg',
        Platform.OS === 'ios' ? 'justify-center' : 'justify-end'
      )}
      style={{ height }}>
      <View className='items-center justify-center w-full'>
        <View className='relative flex-row items-center justify-center gap-0.5 w-full'>
          <Button
            onPress={() => router.back()}
            className='absolute left-4 p-1 px-4'>
            <ArrowLeft size={24} color={colors.primary} />
          </Button>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text
            allowFontScaling={false}
            className='text-2xl font-black uppercase tracking-tight text-foreground'>
            Season Castaways
          </Text>
          <View className='h-6 w-1 bg-primary rounded-full' />
        </View>
      </View>
    </View>
  );
}
