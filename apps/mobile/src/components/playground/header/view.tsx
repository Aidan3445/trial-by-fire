'use client';

import { Text, View } from 'react-native';
import SelectSeason from '~/components/home/scoreboard/selectSeason';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { type SearchableOption } from '~/hooks/ui/useSearchableSelect';
import { cn } from '~/lib/utils';
import { type SeasonsDataQuery } from '~/types/seasons';

interface PlaygroundHeaderProps {
  seasons: SeasonsDataQuery[];
  value: string;
  setValue: (_: string) => void;
  extraHeight?: number;
  className?: string;
}

export default function PlaygroundHeader({ seasons, value, setValue, extraHeight, className }: PlaygroundHeaderProps) {
  const height = useHeaderHeight(extraHeight);

  const seasonOptions: SearchableOption<string>[] = seasons.map(season => ({
    label: season.season.name,
    value: season.season.name
  }));

  return (
    <View
      className={cn(
        'absolute top-0 z-10 w-full items-center justify-end bg-card shadow-lg',
        className
      )}
      style={{ height }}>
      <View className='items-center justify-center w-full'>
        <View className='relative flex-row items-center justify-center gap-0.5 w-full'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text
            allowFontScaling={false}
            className='text-2xl font-black uppercase tracking-tight text-foreground'>
            Scoring Playground
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
