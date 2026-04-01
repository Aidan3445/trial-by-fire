import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe } from '~/types/tribes';
import TribeHistoryCircles from '~/components/shared/castaways/tribeHistoryCircles';
import { divideY } from '~/lib/ui';
import CastawayModal from '~/components/shared/castaways/castawayModal';
import { PlaceIcon } from '~/components/icons/generated';
import { rankBadgeColor, rankTextColor } from '~/lib/colors';

interface CastawayRowProps {
  colIndex: number;
  place: number;
  index: number;
  castaway?: EnrichedCastaway;
  points?: number;
  tribeTimeline?: { episode: number; tribe: Tribe }[];
  allZero?: boolean;
  splitIndex?: number;
  bottomBorder?: boolean;
  maxWidth?: number;
}

export default function CastawayRow({
  colIndex,
  place,
  index,
  castaway,
  points,
  tribeTimeline,
  allZero,
  splitIndex = 0,
  bottomBorder = false,
  maxWidth
}: CastawayRowProps) {
  return (
    <View
      className={cn(
        'h-10 flex-row gap-0.5 px-0.5 py-1',
        divideY(colIndex - splitIndex),
        bottomBorder && 'border-b !h-[36px]'
      )}
      style={maxWidth ? { maxWidth } : undefined}>
      {!allZero && (
        <>
          <View className='w-11 inline-flex items-center justify-center'>
            <PlaceIcon
              allowFontScaling={false}
              size={28}
              color={rankBadgeColor(place)}
              style={{ transform: [{ rotate: `${105 * index}deg` }] }} />
            <Text
              allowFontScaling={false}
              className={cn('absolute font-black tracking-tightest', rankTextColor(place))}>
              {place}
            </Text>
          </View>
          <View className='-ml-2 w-10 items-center justify-center'>
            <Text
              allowFontScaling={false}
              className='text-center font-black tracking-tightest text-primary'>
              {points}
            </Text>
          </View>
        </>
      )}
      <View className='flex-1 flex-row items-center gap-2 pr-2'>
        <CastawayModal castaway={castaway}>
          <Text
            allowFontScaling={false}
            className={cn(
              'text-base font-bold',
              allZero && 'w-full text-center',
              castaway?.eliminatedEpisode
              && !castaway.redemption?.some((r) => r.secondEliminationEpisode === null)
              && 'line-through opacity-40'
            )}
            numberOfLines={1}>
            {castaway?.fullName}
          </Text>
        </CastawayModal>
        <View className='ml-auto flex-row items-center gap-0.5 mr-3'>
          <TribeHistoryCircles tribeTimeline={tribeTimeline ?? []} />
        </View>
      </View>
    </View>
  );
}
