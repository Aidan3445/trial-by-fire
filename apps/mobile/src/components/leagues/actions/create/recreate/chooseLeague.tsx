import { View, Text, Pressable, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { Recycle } from 'lucide-react-native';
import ColorRow from '~/components/shared/colorRow';
import { useLeagues } from '~/hooks/user/useLeagues';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';

interface ChooseLeagueProps {
  selectedHash: string | null;
  onSelect: (_hash: string) => void;
}

export default function ChooseLeague({ selectedHash, onSelect }: ChooseLeagueProps) {
  const { data: leagues } = useLeagues();

  // Filter to only inactive leagues where user is owner
  const ownedInactiveLeaguesBySeason = useMemo(() => {
    if (!leagues) return [];

    const inactiveMap: Record<string, typeof leagues> = {};

    leagues.forEach((league) => {
      if (league.league.status === 'Inactive' && league.member.role === 'Owner') {
        const season = league.league.season;
        inactiveMap[season] ??= [];
        inactiveMap[season].push(league);
      }
    });

    return Object.entries(inactiveMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([season, seasonLeagues]) => ({
        season,
        leagues: seasonLeagues,
      }));
  }, [leagues]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className='items-center justify-center py-2'>
        {/* Title Section */}
        <View className='mb-6 items-center'>
          <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
            <Recycle size={24} color={colors.primary} />
          </View>
          <Text className='text-center text-xl font-black tracking-wide text-foreground'>
            Select a League to Clone
          </Text>
          <Text className='mt-1 text-center text-base text-muted-foreground'>
            You can only clone leagues that you own
          </Text>
        </View>

        {/* League Selection */}
        <View className='w-full gap-4'>
          {ownedInactiveLeaguesBySeason.map(({ season, leagues: seasonLeagues }) => (
            <View key={season} className='rounded-lg border-2 border-primary/20 bg-card pb-2'>
              <View className='flex-row items-center gap-2 p-4'>
                <View className='h-full w-1 rounded-full bg-secondary' />
                <Text className='text-lg font-black uppercase tracking-tight text-muted-foreground'>
                  {season}
                </Text>
              </View>
              <View className='gap-2 px-2'>
                {seasonLeagues.map(({ league, member }) => (
                  <Pressable
                    key={league.hash}
                    onPress={() => onSelect(league.hash)}
                    className={cn(
                      'flex-row items-center justify-between rounded-lg border-2 p-3',
                      selectedHash === league.hash
                        ? 'border-primary bg-primary/10'
                        : 'border-primary/20 bg-primary/5'
                    )}>
                    <View className='flex-1'>
                      <Text className='font-bold text-foreground'>{league.name}</Text>
                      <ColorRow
                        className='mt-1 self-start rounded px-2 py-0.5'
                        color={member.color}>
                        <Text className='text-xs font-semibold text-black'>
                          {member.displayName}
                        </Text>
                      </ColorRow>
                    </View>
                  </Pressable>
                ))}
              </View>
            </View>
          ))}

          {ownedInactiveLeaguesBySeason.length === 0 && (
            <View className='items-center py-8'>
              <Text className='text-center text-xl text-muted-foreground'>
                No leagues available to clone.
              </Text>
              <Text className='mt-1 text-center text-base text-muted-foreground'>
                You must be the owner of an inactive league.
              </Text>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
