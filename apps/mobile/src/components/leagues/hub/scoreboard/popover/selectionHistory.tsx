import { useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import Button from '~/components/common/button';
import { MoveRight, History } from 'lucide-react-native';
import Popover from 'react-native-popover-view';
import { type EnrichedCastaway } from '~/types/castaways';
import ColorRow from '~/components/shared/colorRow';
import { colors } from '~/lib/colors';

interface SelectionHistoryProps {
  selectionList: (EnrichedCastaway | null)[] | undefined;
  secondaryPickList: (EnrichedCastaway | null)[] | undefined;
}

export default function SelectionHistory({ selectionList, secondaryPickList }: SelectionHistoryProps) {
  const [isVisible, setIsVisible] = useState(false);

  const condensedTimeline = useMemo(() => (selectionList ?? [])
    .reduce((acc, castaway, index) => {
      if (castaway === null) return acc;
      const prev = acc[acc.length - 1];
      if (prev) {
        acc[acc.length - 1] = { ...prev, end: index - 1 };
      }
      if (acc[acc.length - 1]?.castaway?.fullName === castaway.fullName) {
        acc[acc.length - 1]!.end = index;
        return acc;
      }

      const start = acc.length === 0 ? 'Draft' : index;
      const isReEntry = typeof start === 'number'
        && castaway.eliminatedEpisode !== null
        && start >= castaway.eliminatedEpisode;

      let end: number | null;
      if (isReEntry && castaway.redemption?.length) {
        const relevantRedemption = [...castaway.redemption]
          .sort((a, b) => b.reentryEpisode - a.reentryEpisode)
          .find(r => typeof start === 'number' && r.reentryEpisode <= start);
        end = relevantRedemption?.secondEliminationEpisode ?? null;
      } else {
        end = castaway.eliminatedEpisode ?? null;
      }

      return [...acc, { castaway, start, end }];
    }, [] as { castaway: EnrichedCastaway, start: number | string, end: number | null }[]),
    [selectionList]);

  return (
    <Popover
      isVisible={isVisible}
      onRequestClose={() => setIsVisible(false)}
      popoverStyle={{
        backgroundColor: colors.card,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: `${colors.primary}4D`,
      }}
      backgroundStyle={{ backgroundColor: 'transparent' }}
      arrowSize={{ width: 0, height: 0 }}
      from={
        <Button onPress={() => setIsVisible(true)} className='ml-1 p-1 active:opacity-60'>
          <History size={18} className='stroke-red-500' />
        </Button>
      }>
      <View className='p-3 gap-2 min-w-[200px]'>
        <Text className='text-sm font-bold uppercase tracking-wider text-center text-foreground'>
          Selection History
        </Text>

        <View className='h-px bg-primary/20' />

        <View className='gap-1'>
          {condensedTimeline.map(({ castaway, start, end }, index) => (
            <View key={index} className='flex-row items-center gap-3'>
              <ColorRow
                className='px-2 justify-center font-medium text-sm'
                color={castaway.tribe?.color ?? '#AAAAAA'}>
                {castaway.fullName}
              </ColorRow>
              <View className='flex-row gap-1 items-center flex-1'>
                <Text className='font-medium text-sm text-foreground'>{start}</Text>
                <MoveRight size={16} className='color-foreground' />
                <Text className='font-medium text-sm text-foreground'>
                  {end ? `${end}` : 'Present'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {!!secondaryPickList?.slice(1)?.length && (
          <>
            <View className='h-px bg-primary/20 mt-2' />

            <Text className='text-sm font-semibold uppercase tracking-wide text-center text-foreground'>
              Secondaries
            </Text>

            <View className='gap-1'>
              {secondaryPickList.slice(1).map((castaway, index) => (
                <View key={index} className='flex-row items-center gap-1'>
                  <ColorRow
                    className='px-2 justify-center font-medium text-sm'
                    color={castaway?.tribe?.color ?? '#AAAAAA'}>
                    {castaway?.fullName ?? 'No Pick'}
                  </ColorRow>
                  <View className='flex-row gap-1 items-center flex-1'>
                    <MoveRight size={16} className='color-foreground' />
                    <Text className='font-medium text-sm text-foreground'>{index + 1}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </View>
    </Popover>
  );
}
