import { useState } from 'react';
import { View, Text } from 'react-native';
import { Flame } from 'lucide-react-native';
import Button from '~/components/common/button';
import { cn } from '~/lib/utils';
import { colors, rankBadgeColor, rankTextColor } from '~/lib/colors';
import { LeaguesIcon, PlaceIcon, PlaygroundIcon } from '~/components/icons/generated';
import { useLiveLeaderboard } from '~/hooks/livePredictions/query/useLiveLeaderboard';
import { useLivePredictionStats } from '~/hooks/livePredictions/query/useLivePredictionStats';
import { useAuth } from '@clerk/expo';
import LeaderboardRow from '~/components/livePredictions/play/leaderboard/row';

type LeaderboardType = 'friends' | 'global';

interface LiveLeaderboardProps {
  seasonId: number | null;
}

export default function LiveLeaderboard({ seasonId }: LiveLeaderboardProps) {
  const { userId } = useAuth();
  const [type, setType] = useState<LeaderboardType>('friends');
  const { data: leaderboard } = useLiveLeaderboard(seasonId, type);
  const { data: myStats } = useLivePredictionStats(seasonId);

  const hasData = leaderboard && leaderboard.length > 0;
  const myIndex = leaderboard?.findIndex((e) => e.userId === userId) ?? -1;
  const myPlace = myIndex >= 0 ? myIndex + 1 : null;
  const isInTop3 = myPlace !== null && myPlace <= 3;

  return (
    <View className='w-full rounded-xl border-2 border-primary/20 bg-card p-2 gap-2'>
      {/* Header + Toggle */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2 px-1'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Leaderboard
          </Text>
        </View>
        <View className='flex-row rounded-lg bg-accent p-0.5 gap-0.5'>
          <Button
            onPress={() => setType('friends')}
            className={cn(
              'flex-row items-center gap-1 rounded-md px-2.5 py-1.5',
              type === 'friends' ? 'bg-primary' : 'bg-transparent'
            )}>
            <LeaguesIcon size={28} color={type === 'friends' ? 'white' : colors.mutedForeground} />
            <Text className={cn(
              'text-sm font-bold',
              type === 'friends' ? 'text-white' : 'text-muted-foreground'
            )}>
              Leagues
            </Text>
          </Button>
          <Button
            onPress={() => setType('global')}
            className={cn(
              'flex-row items-center gap-1 rounded-md px-2.5 py-1.5',
              type === 'global' ? 'bg-primary' : 'bg-transparent'
            )}>
            <PlaygroundIcon size={32} color={type === 'global' ? 'white' : colors.mutedForeground} />
            <Text className={cn(
              'text-sm font-bold',
              type === 'global' ? 'text-white' : 'text-muted-foreground'
            )}>
              Global
            </Text>
          </Button>
        </View>
      </View>

      {/* Empty state */}
      {!hasData && (
        <View className='items-center py-4'>
          <Text className='text-sm text-muted-foreground text-center'>
            {type === 'friends'
              ? 'No friends have played yet this season.'
              : 'Leaderboard will appear after the first prediction is resolved.'}
          </Text>
        </View>
      )}

      {/* Table */}
      {hasData && (
        <View className='bg-primary/5 border-2 border-primary/20 rounded-lg overflow-hidden'>
          {/* Table Header */}
          <View className='flex-row bg-white gap-0.5 px-0.5 rounded-t-md'>
            <View className='w-11 justify-center'>
              <Text
                allowFontScaling={false}
                className='text-base text-center font-bold'>
                Place
              </Text>
            </View>
            <View className='flex-1 justify-center pl-1'>
              <Text
                allowFontScaling={false}
                className='text-base text-left font-bold'>
                Player
              </Text>
            </View>
            <View className='w-16 justify-center'>
              <Text
                allowFontScaling={false}
                className='text-base text-center font-bold'>
                Acc.
              </Text>
            </View>
          </View>

          {/* Rows */}
          {leaderboard.map((entry, i) => (
            <LeaderboardRow
              key={entry.userId}
              entry={entry}
              place={i + 1}
              index={i}
              isYou={entry.userId === userId} />
          ))}
        </View>
      )}

      {/* Your position if not in top entries or no data */}
      {hasData && !isInTop3 && myStats && myStats.totalAnswered > 0 && (
        <>
          <View className='flex-row items-center gap-2 px-2'>
            <View className='flex-1 h-px bg-primary/10' />
            <Text className='text-sm text-muted-foreground'>Your Stats</Text>
            <View className='flex-1 h-px bg-primary/10' />
          </View>
          <View className='flex-row items-center justify-between rounded-lg bg-primary/10 border-2 border-primary/20 px-3 py-2'>
            <View className='flex-row items-center gap-3'>
              {myPlace && (
                <View className='w-11 inline-flex items-center justify-center'>
                  <PlaceIcon size={28} color={rankBadgeColor(myPlace)} />
                  <Text className={cn('absolute font-black tracking-tighter', rankTextColor(myPlace))}>
                    {myPlace}
                  </Text>
                </View>
              )}
              <View>
                <Text className='text-base font-bold text-primary'>You</Text>
                <Text className='text-sm text-muted-foreground'>
                  {myStats.totalCorrect}/{myStats.totalAnswered} correct
                </Text>
              </View>
            </View>
            <View className='items-end gap-0.5'>
              <Text className='text-lg font-black text-primary'>
                {Math.round(myStats.accuracy * 100)}%
              </Text>
              {myStats.currentStreak > 1 && (
                <View className='flex-row items-center gap-1'>
                  <Flame size={12} color='#f59e0b' />
                  <Text className='text-sm font-bold text-amber-500'>
                    {myStats.currentStreak}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </>
      )}
    </View>
  );
}
