import MarqueeText from '~/components/common/marquee';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Platform, Text, View } from 'react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

interface RecreateLeagueHeaderProps {
  leagueName?: string;
}

export default function RecreateLeagueHeader({ leagueName }: RecreateLeagueHeaderProps) {
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
        <Text className='text-2xl font-black uppercase tracking-tight text-foreground -mb-2'>
          Clone
        </Text>
        <View className='relative flex-row items-center justify-center gap-0.5 w-full'>
          <Button
            onPress={() => router.back()}
            className='absolute left-4 p-1 px-4'>
            <ArrowLeft size={24} color={colors.primary} />
          </Button>
          <View className='relative flex-row items-center justify-center max-w-[60vw]'>
            <View className='h-6 w-1 bg-primary rounded-full' />
            <MarqueeText
              text={leagueName ?? 'League'}
              center
              allowFontScaling={false}
              className='text-2xl font-black uppercase tracking-tight text-foreground transition-all'
              containerClassName='flex-row'
              noMarqueeContainerClassName='w-min px-0.5' />
            <View className='h-6 w-1 bg-primary rounded-full' />
          </View>
        </View>
      </View>
    </View>
  );
}
