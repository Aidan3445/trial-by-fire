import { Platform, Text, View } from 'react-native';
import BaseEventRules from '~/components/leagues/customization/events/base/view';
import CustomEventRules from '~/components/leagues/customization/events/custom/view';
import ShauhinMode from '~/components/leagues/customization/events/shauhin/view';
import SurvivalStreaks from '~/components/leagues/customization/settings/survivalStreak/view';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';
import { cn } from '~/lib/utils';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import LeagueSettings from '~/components/leagues/customization/settings/league/view';
import SecondaryPickSettings from '~/components/leagues/customization/settings/secondary/view';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';

export default function LeagueSettingsScreen() {
  const { refreshing, onRefresh, scrollY, handleScroll } = useLeagueRefresh();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();

  return (
    <SafeAreaRefreshView
      alreadySafe
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View
        className={cn(
          'page justify-start gap-y-4 px-1.5 pt-8 pb-1.5',
          refreshing && Platform.OS === 'ios' && 'pt-12'
        )}>
        <LeagueSettings
          isAdmin={leagueMembers?.loggedIn?.role === 'Admin'}
          isOwner={leagueMembers?.loggedIn?.role === 'Owner'} />

        {league?.status !== 'Predraft' && (
          <>
            <View className='w-full flex-row items-center justify-center gap-2 p-2 bg-card rounded-xl border-2 border-primary/20'>
              <View className='h-5 w-0.5 bg-primary rounded-full' />
              <Text className='text-2xl font-black tracking-tight text-center uppercase'>
                League Scoring
              </Text>
              <View className='h-5 w-0.5 bg-primary rounded-full' />
            </View>
            <SurvivalStreaks />
            <SecondaryPickSettings />
            <BaseEventRules />
            <ShauhinMode />
            <CustomEventRules />
          </>
        )}
      </View>
    </SafeAreaRefreshView>
  );
}
