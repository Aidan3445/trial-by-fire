import { View, Text } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import MemberRow from '~/components/leagues/hub/scoreboard/row';
import { type EnrichedCastaway } from '~/types/castaways';
import { PointsIcon } from '~/components/icons/generated';

interface ScoreboardProps {
  overrideHash?: string;
  maxRows?: number;
  className?: string;
}

export default function Scoreboard({ overrideHash, maxRows, className }: ScoreboardProps = {}) {
  const {
    sortedMemberScores,
    loggedInIndex,
    leagueSettings,
    leagueRules,
    selectionTimeline,
    castaways,
    keyEpisodes,
    currentStreaks,
    shotInTheDarkStatus
  } = useLeagueData(overrideHash);

  const episodeNum = keyEpisodes?.previousEpisode?.airStatus === 'Airing'
    ? keyEpisodes.previousEpisode.episodeNumber
    : keyEpisodes?.nextEpisode?.episodeNumber ?? Infinity;

  return (
    <View className={className}>
      <View className='flex-row bg-white gap-0.5 px-0.5 rounded-t-md'>
        <View className='w-11 justify-center'>
          <Text
            allowFontScaling={false}
            className='text-base text-center font-medium'>
            Place
          </Text>
        </View>
        <View className='w-12 -ml-2 items-center justify-center'>
          <PointsIcon size={12} color='black' />
        </View>
        <View className='flex-1 justify-center pl-1'>
          <Text
            allowFontScaling={false}
            className='text-base text-left font-medium'>
            Member
          </Text>
        </View>
        <View className='w-24 justify-center'>
          <Text
            allowFontScaling={false}
            className='text-left font-medium'>
            Survivor
          </Text>
        </View>
        {leagueSettings?.secondaryPickEnabled && (
          <View className='w-24 justify-center'>
            <Text
              allowFontScaling={false}
              className='text-left font-medium'>
              Secondary
            </Text>
          </View>
        )}
        <View className='w-6 items-center justify-center'>
          {/* ScoreboardHelp component would go here */}
          <TrendingUp size={14} className='text-muted-foreground' />
        </View>
      </View>
      <View>
        {sortedMemberScores.map(({ member, scores }, index) => {
          if (
            maxRows
            && index !== loggedInIndex
            && (loggedInIndex >= maxRows ? index >= maxRows - 1 : index >= maxRows)
          )
            return null;


          const castawayId = selectionTimeline?.memberCastaways?.[member.memberId]?.
            slice(0, episodeNum + 1).pop();
          const castaway = castawayId !== undefined ?
            (castaways?.find((c) => c.castawayId === castawayId)) : undefined;
          const selectionList = selectionTimeline?.memberCastaways?.[member.memberId]?.map(
            (id) => castaways?.find((c) => c.castawayId === id) ?? null) ?? [];
          let secondaryPick: EnrichedCastaway | null | undefined = undefined;
          const findSecondaryPick = castaways?.find((c) =>
            c.castawayId === selectionTimeline?.secondaryPicks?.[member.memberId]?.[episodeNum]);
          if (findSecondaryPick) {
            secondaryPick = findSecondaryPick;
          } else if (!leagueRules?.secondaryPick?.publicPicks && loggedInIndex !== index) {
            secondaryPick = null;
          }
          const points = scores.slice().pop() ?? 0;

          // place is index + 1 - number of members above them with same score
          const numberSameScore = sortedMemberScores.slice(0, index)
            .filter(({ scores: s }) => (s.slice().pop() ?? 0) === points)
            .length;
          const place = index + 1 - numberSameScore;

          return (
            <MemberRow
              key={index}
              place={place}
              index={index}
              member={member}
              currentStreak={currentStreaks?.[member.memberId] ?? 0}
              castaway={castaway}
              selectionList={selectionList}
              secondaryPick={secondaryPick}
              secondaryPickList={selectionTimeline?.secondaryPicks?.[member.memberId]?.map(
                (id) => castaways?.find((c) => c.castawayId === id) ?? null) ?? []}
              points={points}
              color={member.color}
              dashedAbove={!!maxRows && loggedInIndex > maxRows && member.loggedIn}
              overrideHash={overrideHash}
              shotInTheDarkStatus={shotInTheDarkStatus?.[member.memberId]}
              isAiring={keyEpisodes?.previousEpisode?.airStatus === 'Airing'} />
          );
        })}
      </View>
    </View>
  );
}
