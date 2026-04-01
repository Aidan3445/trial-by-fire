'use client';

import { Redirect, Stack, useLocalSearchParams, useSegments } from 'expo-router';
import { View } from 'react-native';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import LoadingScreen from '~/components/auth/loadingScreen';

export default function LeagueLayout() {
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const segments = useSegments();
  const { data: league, isLoading } = useLeague(hash);

  const isModalRoute = segments.includes('(modals)');
  const isSettingsRoute = segments.includes('settings');
  const currentLeaf = segments[segments.length - 1];

  if (isLoading) {
    return (
      <View className='flex-1 bg-background'>
        <LoadingScreen />
      </View>
    );
  }

  if (!league) {
    return <Redirect href='/leagues' />;
  }

  if (!isModalRoute && !isSettingsRoute) {
    if (league.status === 'Predraft' && currentLeaf !== 'predraft') {
      return <Redirect href={`/leagues/${hash}/predraft`} />;
    }

    if (league.status === 'Draft' && currentLeaf !== 'draft') {
      return <Redirect href={`/leagues/${hash}/draft`} />;
    }

    if (
      league.status === 'Active' &&
      (currentLeaf === 'draft' || currentLeaf === 'predraft')
    ) {
      return <Redirect href={`/leagues/${hash}`} />;
    }
  }

  return (
    <Stack>
      <Stack.Screen name='index' options={{ headerShown: false }} />
      <Stack.Screen name='draft' options={{ headerShown: false }} />
      <Stack.Screen name='predraft' options={{ headerShown: false }} />

      <Stack.Screen
        name='settings'
        options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
    </Stack>
  );
}
