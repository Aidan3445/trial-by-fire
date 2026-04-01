import { Stack } from 'expo-router';
import QueryClientContextProvider from '~/context/reactQueryContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'react-native';
import { useEffect, useRef } from 'react';
import { registerPushToken } from '~/lib/notifications';
import { useFetch } from '~/hooks/helpers/useFetch';
import { Asset } from 'expo-asset';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useChangeLeaderboardUsername } from '~/hooks/livePredictions/mutation/useChangeLeaderboardUsername';
import { useAuth } from '@clerk/expo';

export const FIRST_LOGIN_KEY = 'hasEstablishedLeaderboardUsername';
const LogoImage = require('~/assets/LogoFull.png');

function NotificationManager() {
  const { isSignedIn } = useAuth();
  const postData = useFetch('POST');
  const postRef = useRef(postData);
  postRef.current = postData;

  useEffect(() => {
    if (!isSignedIn) return;

    registerPushToken(postRef.current).catch((err) =>
      console.error('Failed to register push token:', err),
    );

    (async () => {
      try {
        await Asset.loadAsync(LogoImage);
      } catch (e) {
        console.warn('Logo prefetch failed', e);
      }
    })();
  }, [isSignedIn]);

  return null;
}

function FirstLoginManager() {
  const { isSignedIn } = useAuth();
  const { mutateAsync: establishLeaderboardUsername } = useChangeLeaderboardUsername();

  useEffect(() => {
    if (!isSignedIn) return;

    (async () => {
      const hasEstablished = await AsyncStorage.getItem(FIRST_LOGIN_KEY);
      if (hasEstablished) return;
      await establishLeaderboardUsername(undefined, {
        onSuccess: () => void AsyncStorage.setItem(FIRST_LOGIN_KEY, 'true'),
        onError: (err) => console.error('Failed to establish leaderboard username:', err),
      });
    })();
  }, [establishLeaderboardUsername, isSignedIn]);

  return null;
}

export default function ProtectedLayout() {
  return (
    <GestureHandlerRootView>
      <StatusBar barStyle='dark-content' />
      <QueryClientContextProvider>
        <NotificationManager />
        <FirstLoginManager />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
          <Stack.Screen
            name='(modals)'
            options={{
              headerShown: false,
              presentation: 'modal',
              animation: 'slide_from_bottom',
            }} />
        </Stack>
      </QueryClientContextProvider>
    </GestureHandlerRootView>
  );
}
