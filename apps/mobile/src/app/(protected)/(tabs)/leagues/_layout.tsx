import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UnifiedLeagueHeader from '~/components/leagues/shared/header/view';

export default function LeaguesLayout() {
  return (
    <SafeAreaView edges={['top']} className='flex-1 bg-background relative'>
      <UnifiedLeagueHeader />
      <Stack initialRouteName='index' screenOptions={{ headerShown: false }}>
        <Stack.Screen name='index' options={{ animation: 'slide_from_left' }} />
        <Stack.Screen name='[hash]' />
      </Stack>
    </SafeAreaView>
  );
}
