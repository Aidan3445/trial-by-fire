'use client';

import SelectSeason from '~/components/home/scoreboard/selectSeason';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import { cn } from '~/lib/utils';
import { type SeasonsDataQuery } from '~/types/seasons';
import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Platform, Text, View } from 'react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';

interface NewLiveEventHeaderProps {
  seasons: SeasonsDataQuery[];
  value: string;
  setValue: (_: string) => void;
}

export default function NewLivePredictionHeader({ seasons, value, setValue }: NewLiveEventHeaderProps) {
  const router = useRouter();
  const height = useHeaderHeight(Platform.OS === 'ios' ? 0 : undefined);

  const seasonOptions: SearchableOption<string>[] = seasons.map(season => ({
    label: season.season.name,
    value: season.season.name
  }));

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
            Live Predictions
          </Text>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <SelectSeason
            seasons={seasonOptions}
            value={value}
            setValue={setValue}
            className='right-4 top-1/2 translate-y-[-50%]' />
        </View>
      </View>
    </View>
  );
}
