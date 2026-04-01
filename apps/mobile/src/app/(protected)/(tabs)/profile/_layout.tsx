import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import ProfileHeader from '~/components/profile/header/view';

export default function ProfileLayout() {
  return (
    <SafeAreaView edges={['top']} className='relative flex-1 bg-background'>
      <ProfileHeader />
      <Stack initialRouteName='index' screenOptions={{ headerShown: false }}>
        <Stack.Screen name='index' options={{ headerShown: false }} />
        <Stack.Screen
          name='account'
          options={{ headerShown: false, presentation: 'card', animation: 'slide_from_right' }} />
      </Stack>
    </SafeAreaView>
  );
}
