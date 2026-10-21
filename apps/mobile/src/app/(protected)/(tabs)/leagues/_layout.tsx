import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import UnifiedLeagueHeader from '~/components/leagues/shared/header/view';

export const unstable_settings = { anchor: 'index' };

export default function LeaguesLayout() {
  return (
    <SafeAreaView edges={['top']} className='flex-1 bg-background relative'>
      <UnifiedLeagueHeader />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name='index' options={{ animation: 'slide_from_left' }} />
        <Stack.Screen name='[hash]' />
      </Stack>
    </SafeAreaView>
  );
}
