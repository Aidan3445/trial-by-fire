'use client';

import { View } from 'react-native';
import { ArrowLeft, HelpCircle, Settings, Users } from 'lucide-react-native';
import MarqueeText from '~/components/common/marquee';
import useLeaguesHeader from '~/hooks/ui/useLeaguesHeader';
import { HeaderButton } from '~/components/leagues/shared/header/button';

export default function UnifiedLeagueHeader() {
  const { height, title, buttons } = useLeaguesHeader();

  return (
    <View
      className='absolute top-0 z-10 w-full items-center justify-end bg-card shadow-lg'
      style={{ height }}>
      <View className='items-center justify-center w-full'>
        <View className='relative flex-row items-center justify-center w-full max-w-72'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <MarqueeText
            text={title}
            center
            allowFontScaling={false}
            className='text-2xl font-black uppercase tracking-tight text-foreground'
            containerClassName='flex-row'
            noMarqueeContainerClassName='w-min px-0.5' />
          <View className='h-6 w-1 bg-primary rounded-full' />
        </View>

        <HeaderButton {...buttons.back} icon={ArrowLeft} position='left' />
        <HeaderButton {...buttons.settings} icon={Settings} position='right' />
        <HeaderButton {...buttons.users} icon={Users} position='right' />
        <HeaderButton {...buttons.tutorial} icon={HelpCircle} position='right' />
      </View>
    </View>
  );
}
