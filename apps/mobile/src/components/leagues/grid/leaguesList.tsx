import { Text, View } from 'react-native';
import { useMemo } from 'react';
import { useLeagues } from '~/hooks/user/useLeagues';
import { usePendingLeagues } from '~/hooks/user/usePendingLeagues';
import LeagueCard from '~/components/leagues/grid/leagueCard';
import QuickActions from '~/components/home/quickActions/view';
import LeagueSeasonCarousel from '~/components/leagues/grid/seasonCarousel';
import { useSeasons } from '~/hooks/seasons/useSeasons';

export default function LeaguesList() {
  const { data: leagues } = useLeagues();
  const { data: pendingLeagues } = usePendingLeagues();
  const { data: seasons } = useSeasons(true);

  const { currentLeaguesBySeason, inactiveLeaguesBySeason } = useMemo(() => {
    if (!leagues) {
      return {
        currentLeaguesBySeason: [],
        inactiveLeaguesBySeason: [],
      };
    }

    const currentMap: Record<number, typeof leagues> = {};
    const inactiveMap: Record<string, typeof leagues> = {};

    leagues.forEach((league) => {
      if (league.league.status === 'Inactive') {
        const season = league.league.season;
        inactiveMap[season] ??= [];
        inactiveMap[season].push(league);
      } else {
        const { seasonId } = league.league;
        currentMap[seasonId] ??= [];
        currentMap[seasonId].push(league);
      }
    });

    // Next season's leagues can exist while this one airs: the airing season first
    // Falls back to season order when a season isn't in the cached list yet
    const premiere = (seasonId: number) => {
      const date = seasons?.find((season) => season.seasonId === seasonId)?.premiereDate;
      return date ? new Date(date).getTime() : null;
    };
    const bySeason = (a: number, b: number) => {
      const [premiereA, premiereB] = [premiere(a), premiere(b)];
      return premiereA !== null && premiereB !== null ? premiereA - premiereB : a - b;
    };
    const currentBySeason = Object.values(currentMap)
      .map((seasonLeagues) => ({
        seasonId: seasonLeagues[0]!.league.seasonId,
        season: seasonLeagues[0]!.league.season,
        leagues: seasonLeagues,
      }))
      .sort((a, b) => bySeason(a.seasonId, b.seasonId));

    // Newest season first (by premiere, so Survivor 9 doesn't sort above Survivor 50)
    const inactiveBySeason = Object.entries(inactiveMap)
      .sort(([, a], [, b]) => bySeason(b[0]!.league.seasonId, a[0]!.league.seasonId))
      .map(([season, seasonLeagues]) => ({
        season,
        leagues: seasonLeagues,
      }));

    return {
      currentLeaguesBySeason: currentBySeason,
      inactiveLeaguesBySeason: inactiveBySeason,
    };
  }, [leagues, seasons]);

  return (
    <View className='w-full gap-4 flex-1'>
      {/* Active Leagues Section */}
      {currentLeaguesBySeason.length > 0 ? (
        currentLeaguesBySeason.map(({ seasonId, season, leagues: seasonLeagues }) => (
          <View key={seasonId} className='rounded-xl border-2 border-primary/20 bg-card pb-2'>
            {/* Header */}
            <View className='p-4 flex-row items-center gap-2'>
              <View className='h-full w-1 rounded-full bg-primary' />
              <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                {season}
              </Text>
            </View>

            {/* Leagues Grid/Carousel */}
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
        ))
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
