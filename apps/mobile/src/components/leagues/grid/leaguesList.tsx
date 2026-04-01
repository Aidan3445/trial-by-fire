import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { useLeagues } from '~/hooks/user/useLeagues';
import { usePendingLeagues } from '~/hooks/user/usePendingLeagues';
import LeagueCard from '~/components/leagues/grid/leagueCard';
import QuickActions from '~/components/home/quickActions/view';
import LeagueSeasonCarousel from '~/components/leagues/grid/seasonCarousel';

export default function LeaguesList() {
  const { data: leagues } = useLeagues();
  const { data: pendingLeagues } = usePendingLeagues();

  const { currentLeagues, inactiveLeaguesBySeason } = useMemo(() => {
    if (!leagues) {
      return {
        currentLeagues: [],
        inactiveLeaguesBySeason: [],
      };
    }

    const current: typeof leagues = [];
    const inactiveMap: Record<string, typeof leagues> = {};

    leagues.forEach((league) => {
      if (league.league.status === 'Inactive') {
        const season = league.league.season;
        inactiveMap[season] ??= [];
        inactiveMap[season].push(league);
      } else {
        current.push(league);
      }
    });

    // Convert to array and sort by season (descending)
    const inactiveBySeason = Object.entries(inactiveMap)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([season, seasonLeagues]) => ({
        season,
        leagues: seasonLeagues,
      }));

    return {
      currentLeagues: current,
      inactiveLeaguesBySeason: inactiveBySeason,
    };
  }, [leagues]);

  return (
    <View className='w-full gap-4 flex-1'>
      {/* Active Leagues Section */}
      {currentLeagues.length > 0 ? (
        <View className='rounded-xl border-2 border-primary/20 bg-card pb-2'>
          {/* Header */}
          <View className='p-4 flex-row items-center gap-2'>
            <View className='h-full w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              {currentLeagues[0]?.league.season}
            </Text>
          </View>

          {/* Leagues Grid/Carousel */}
          {currentLeagues.length === 1 ? (
            <View className='min-h-36'>
              <LeagueCard
                league={currentLeagues[0]!.league}
                member={currentLeagues[0]!.member}
                currentSelection={currentLeagues[0]!.currentSelection} />
            </View>
          ) : (
            <LeagueSeasonCarousel leagues={currentLeagues} />
          )}
        </View>
      ) : (
        <View className='rounded-xl border-2 border-primary/20 bg-card p-4'>
          <View className='mb-4 flex-row items-center gap-2'>
            <View className='h-full w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              Active Leagues
            </Text>
          </View>
          <View className='items-center py-4'>
            <Text className='text-center text-muted-foreground'>
              You don't have any active leagues.
            </Text>
            <Text className='text-center text-muted-foreground'>
              Create or join one to get started!
            </Text>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <QuickActions
        className='rounded-xl border-2 border-primary/20 bg-card opacity-80'
        showClone={inactiveLeaguesBySeason.some(season => season.leagues.some(league => league.member.role === 'Owner'))}
        pendingLeagues={pendingLeagues} />

      {/* Inactive Leagues by Season */}
      {inactiveLeaguesBySeason.length > 0 && (
        <View className='gap-4'>
          {inactiveLeaguesBySeason.map(({ season, leagues: seasonLeagues }) => (
            <View
              key={season}
              className='rounded-xl border-2 border-primary/20 bg-card opacity-80 pb-2'>
              {/* Season Header */}
              <View className='flex-row items-center gap-2 p-4'>
                <View className='h-full w-1 rounded-full bg-primary' />
                <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                  {season}
                </Text>
              </View>

              {/* Season Leagues */}
              {seasonLeagues.length === 1 ? (
                <View className='min-h-36'>
                  <LeagueCard
                    league={seasonLeagues[0]!.league}
                    member={seasonLeagues[0]!.member}
                    currentSelection={seasonLeagues[0]!.currentSelection} />
                </View>
              ) : (
                <LeagueSeasonCarousel leagues={seasonLeagues} />
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}
