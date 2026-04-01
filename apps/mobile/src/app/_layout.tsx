import '~/global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { ClerkLoaded, ClerkProvider, useAuth } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect } from 'react';
import LoadingScreen from '~/components/auth/loadingScreen';
import { useDeepLinkHandler } from '~/hooks/routing/useDeepLinkHandler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { useRequestPushPermission } from '~/hooks/user/useRequestPushPermissions';

// Suppress specific warning from react-native-reanimated-carousel
const originalWarn = console.warn;
console.warn = (...args) => {
  if (args[0]?.includes?.('`value` during component render')) {
    return;
  }
  originalWarn(...args);
};

function InitialLayout() {
  const { isSignedIn, isLoaded } = useAuth();
  useRequestPushPermission();
  const segments = useSegments();
  const router = useRouter();
  useDeepLinkHandler();

  useEffect(() => {
    if (!isLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(protected)';

    if (!isSignedIn && !inAuthGroup) {
      router.replace('/(auth)/sign-in');
    } else if (isSignedIn && !inProtectedGroup) {
      router.replace('/');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSignedIn, isLoaded, segments]);

  if (!isLoaded) {
    return <LoadingScreen noBounce />;
  }

  return <Slot />;
}

export default function RootLayout() {
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP)
    .catch(() => console.warn('Screen Orientation lock failed'));

  return (
    <ClerkProvider
      publishableKey={process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!}
      tokenCache={tokenCache}
      telemetry={false}>
      <ClerkLoaded>
        <KeyboardProvider>
          <InitialLayout />
        </KeyboardProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
