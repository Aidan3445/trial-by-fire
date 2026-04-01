'use client';

import { View, Alert, Platform } from 'react-native';
import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueActionDetails } from '~/hooks/leagues/enrich/useActionDetails';
import { useEffect, useMemo } from 'react';
import DraftOrder from '~/components/leagues/draft/order/view';
import ChooseCastaway from '~/components/leagues/draft/chooseCastaway/view';
import PredictionsCarousel from '~/components/leagues/draft/predictions/view';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';
import { cn } from '~/lib/utils';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';

export default function DraftScreen() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: league } = useLeague(hash);
  const router = useRouter();
  const { refreshing, onRefresh, scrollY, handleScroll } = useLeagueRefresh();

  const {
    actionDetails,
    membersWithPicks,
    onTheClock,
    onDeck,
    leagueMembers,
    rules,
    predictionRuleCount,
    settings,
    predictionsMade,
    dialogOpen,
    setDialogOpen
  } = useLeagueActionDetails(hash);

  const castaways = useMemo(() =>
    Object.values(actionDetails ?? {})
      .flatMap(({ castaways }) => castaways.map(c => c.castaway)), [actionDetails]);

  const tribes = useMemo(() =>
    Object.values(actionDetails ?? {}).map(({ tribe }) => tribe), [actionDetails]);

  // Handle draft completion redirect
  useEffect(() => {
    if (league && league.status === 'Active') {
      onRefresh();
      router.navigate({
        pathname: '/leagues/[hash]',
        params: { hash }
      });
    }
  }, [league?.status, hash, router, league, onRefresh]);

  // Handle user turn dialog
  useEffect(() => {
    if (dialogOpen && (onTheClock?.loggedIn || onDeck?.loggedIn)) {
      const message = onTheClock?.loggedIn
        ? 'It\'s your turn to pick!'
        : 'It\'s almost your turn to pick!';

      const description =
        'This castaway will earn you points based on their performance in the game. Additionally you will earn points for each successive episode they survive'
        + (settings?.survivalCap ? ` up to a maximum of ${settings.survivalCap} points.` : '.')
        + ' When they are voted out you will select from the remaining castaways.';

      Alert.alert(message, description, [
        { text: 'I\'m ready!', onPress: () => setDialogOpen?.(false) }
      ]);
    }
  }, [dialogOpen, onTheClock?.loggedIn, onDeck?.loggedIn, settings?.survivalCap, setDialogOpen]);

  if (!league) return <Redirect href='/leagues' />;
  if (league.status !== 'Draft') return <Redirect href={`/leagues/${hash}`} />;

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
        <DraftOrder
          hash={hash}
          leagueMembers={leagueMembers}
          onTheClockMemberId={onTheClock?.memberId}
          membersWithPicks={membersWithPicks} />
        {(onTheClock?.loggedIn || onDeck?.loggedIn) && actionDetails && (
          <ChooseCastaway
            draftDetails={actionDetails}
            onDeck={!!onDeck?.loggedIn}
            hash={hash} />
        )}
        <PredictionsCarousel
          rules={rules}
          predictionRuleCount={predictionRuleCount}
          predictionsMade={predictionsMade}
          castaways={castaways}
          tribes={tribes} />
      </View>
    </SafeAreaRefreshView>
  );
}
