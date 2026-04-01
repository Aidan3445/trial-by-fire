import { Stack } from 'expo-router';

export default function AuthRoutesLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
      <Stack.Screen name='sign-in' options={{ animation: 'none' }} />
      <Stack.Screen name='sign-up' options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name='forgot-password' options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
