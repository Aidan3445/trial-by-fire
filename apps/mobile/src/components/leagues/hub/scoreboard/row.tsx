import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { type LeagueMember } from '~/types/leagueMembers';
import { type EnrichedCastaway } from '~/types/castaways';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { divideY } from '~/lib/ui';
import ColorRow from '~/components/shared/colorRow';
import SurvivalStreaks from '~/components/leagues/hub/scoreboard/popover/survivalStreaks';
import MarqueeText from '~/components/common/marquee';
import CastawayModal from '~/components/shared/castaways/castawayModal';
import { PlaceIcon } from '~/components/icons/generated';
import { rankBadgeColor, rankTextColor } from '~/lib/colors';

interface MemberRowProps {
  place: number;
  index: number;
  member: LeagueMember;
  currentStreak?: number;
  castaway?: EnrichedCastaway;
  selectionList?: (EnrichedCastaway | null)[];
  secondaryPick?: EnrichedCastaway | null;
  secondaryPickList?: (EnrichedCastaway | null)[];
  points: number;
  color: string;
  overrideHash?: string;
  dashedAbove?: boolean;
  shotInTheDarkStatus?: { episodeNumber: number, status: 'pending' | 'saved' | 'wasted' } | null;
  isAiring?: boolean;
}

export default function MemberRow({
  place,
  index,
  member,
  currentStreak,
  castaway,
  secondaryPick,
  points,
  color,
  dashedAbove: doubleBelow,
  overrideHash,
  shotInTheDarkStatus,
  isAiring
}: MemberRowProps) {
  const { data: leagueSettings } = useLeagueSettings(overrideHash);

  const isFullyEliminated =
    castaway?.eliminatedEpisode &&
    !castaway?.redemption?.some(r => r.secondEliminationEpisode === null);

  const isSecondaryPickEliminated =
    secondaryPick?.eliminatedEpisode &&
    !secondaryPick?.redemption?.some(r => r.secondEliminationEpisode === null);

  const wholePoints = Math.floor(points);
  const isHalfPoint = points - wholePoints > 0;

  return (
    <View
      className={cn(
        'h-10 flex-row px-0.5 gap-0.5 items-center',
        divideY(index),
        doubleBelow && 'border-dashed'
      )}>
      <View className='w-11 inline-flex items-center justify-center'>
        <PlaceIcon
          allowFontScaling={false}
          size={30}
          color={rankBadgeColor(place)}
          style={{ transform: [{ rotate: `${105 * index}deg` }] }} />
        <Text
          allowFontScaling={false}
          className={cn('absolute font-black tracking-tightest', rankTextColor(place))}>
          {place}
        </Text>
      </View>
      <View className='w-12 -ml-2 items-center justify-center flex-row'>
        <Text
          allowFontScaling={false}
          className='text-center font-black tracking-tightest text-primary'>
          {wholePoints}
        </Text>
        {isHalfPoint && (
          <View className='scale-50'>
            <Text
              allowFontScaling={false}
              className='text-center font-black tracking-tighter text-primary border-b-2 border-primary'>
              1
            </Text>
            <Text
              allowFontScaling={false}
              className='text-center font-black tracking-tighter text-primary'>
              2
            </Text>
          </View>
        )}
      </View>
      <ColorRow color={color} className='flex-1 items-center'>
        <MarqueeText
          allowFontScaling={false}
          text={member.displayName}
          className={cn(
            'text-base font-bold transition-all text-black cursor-pointer',
            member.loggedIn && 'text-primary'
          )}
          marqueeThreshold={0}
          containerClassName='flex-row'>
        </MarqueeText>
      </ColorRow>
      <View className='w-24 justify-center'>
        <CastawayModal castaway={castaway}>
          <Text
            allowFontScaling={false}
            className={cn(
              'text-base font-medium transition-all text-black text-nowrap',
              isFullyEliminated && 'line-through opacity-40'
            )}>
            {castaway?.shortName || 'None'}
          </Text>
        </CastawayModal>
      </View>
      {leagueSettings?.secondaryPickEnabled && (secondaryPick ? (
        <View className='w-24 justify-center'>
          <CastawayModal castaway={secondaryPick}>
            <Text
              allowFontScaling={false}
              className={cn(
                'text-base font-medium transition-all text-black text-nowrap',
                isSecondaryPickEliminated && 'line-through opacity-40'
              )}>
              {secondaryPick?.shortName || 'None'}
            </Text>
          </CastawayModal>
        </View>
      ) : (
        <View className='w-24 justify-center'>
          <Text
            allowFontScaling={false}
            className='text-base md:text-lg font-medium text-muted-foreground'>
            {secondaryPick === null ? 'Hidden' : isAiring ? 'No Pick' : 'Pending'}...
          </Text>
        </View>
      ))}
      {leagueSettings && leagueSettings.survivalCap > 0 && (
        <View className='w-6 items-center justify-center'>
          <SurvivalStreaks
            isLoggedIn={member.loggedIn}
            currentStreak={currentStreak}
            eliminatedEpisode={castaway?.eliminatedEpisode}
            shotInTheDarkStatus={shotInTheDarkStatus}
            survivalCap={leagueSettings.survivalCap} />
        </View>
      )}
    </View>
  );
}
