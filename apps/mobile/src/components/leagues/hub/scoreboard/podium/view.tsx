import { View } from 'react-native';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import { cn } from '~/lib/utils';
import Tier from '~/components/leagues/hub/scoreboard/podium/tier';

interface PodiumProps {
  overrideHash?: string;
  className?: string;
}

export default function Podium({ overrideHash, className }: PodiumProps) {
  const { sortedMemberScores } = useLeagueData(overrideHash);

  // Handle ties:
  // 1st and 2nd place tie -> both gold, no silver, next is bronze
  // 2nd and 3rd place tie -> both silver, no bronze
  // 1st, 2nd, and 3rd place tie -> all gold
  const firstPlaceScore = sortedMemberScores[0]?.scores.slice().pop() ?? 0;
  const secondPlaceScore = sortedMemberScores[1]?.scores.slice().pop() ?? 0;
  const thirdPlaceScore = sortedMemberScores[2]?.scores.slice().pop() ?? 0;

  const tieBetweenFirstAndSecond = secondPlaceScore === firstPlaceScore;
  const tieBetweenSecondAndThird = thirdPlaceScore === secondPlaceScore;

  return (
    <View
      className={cn(
        'w-full items-center rounded-lg bg-card px-1',
        className
      )}>
      <View className='flex-row items-end justify-center w-full h-full pt-24'>
        {/* 2nd Place - Left */}
        <Tier
          member={sortedMemberScores[1]?.member}
          points={sortedMemberScores[1]?.scores.slice().pop()}
          place={tieBetweenFirstAndSecond ? 'Gold' : 'Silver'}
          position='left' />

        {/* 1st Place - Center */}
        <Tier
          member={sortedMemberScores[0]?.member}
          points={sortedMemberScores[0]?.scores.slice().pop()}
          place='Gold'
          position='center' />

        {/* 3rd Place - Right */}
        <Tier
          member={sortedMemberScores[2]?.member}
          points={sortedMemberScores[2]?.scores.slice().pop()}
          place={
            tieBetweenSecondAndThird
              ? tieBetweenFirstAndSecond
                ? 'Gold'
                : 'Silver'
              : 'Bronze'
          }
          position='right' />
      </View>
    </View>
  );
}
