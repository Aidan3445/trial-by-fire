import * as Linking from 'expo-linking';
import { useRouter, usePathname, useSegments, useRootNavigationState } from 'expo-router';
import { useEffect, useRef } from 'react';
import { useAuth } from '@clerk/expo';
import {
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
} from '~/lib/routing';

export function useDeepLinkHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = useSegments() as string[];
  const navigationState = useRootNavigationState();
  const { isSignedIn, isLoaded } = useAuth();

  const handledInitialUrl = useRef(false);

  const isNavigationReady = !!navigationState?.key;
  const inProtectedGroup = segments[0] === '(protected)';
  const inTabsGroup = segments[1] === '(tabs)';

  // Cold start: capture and handle initial URL
  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;
    if (handledInitialUrl.current) return;

    const handleInitialURL = async () => {
      const url = await Linking.getInitialURL();
      if (!url) return;
      const link = parseDeepLink(url);
      if (!link) return;

      handledInitialUrl.current = true;
      if (link.path === 'join') {
        if (!isSignedIn) {
          setPendingDeepLink({ path: 'join', params: { hash: link.hash } });
          return;
        }
        router.replace('/(protected)/(tabs)');
        // eslint-disable-next-line no-undef
        setTimeout(() => {
          router.push(`/(protected)/(modals)/join?hash=${link.hash}`);
        }, 150);
      }
    };

    handleInitialURL();
  }, [isLoaded, isSignedIn, isNavigationReady, router]);

  // Handle pending deep link after auth (signed-out cold start flow)
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isNavigationReady) return;
    if (!inProtectedGroup || !inTabsGroup) return;

    const pending = getPendingDeepLink();
    if (!pending) return;

    clearPendingDeepLink();

    if (pending.path === 'join' && pending.params.hash) {
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        router.push(`/(protected)/(modals)/join?hash=${pending.params.hash}`);
      }, 150);
    }
  }, [isLoaded, isSignedIn, isNavigationReady, inProtectedGroup, inTabsGroup, router]);

  // Warm start: handle URLs while app is open
  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;

    const subscription = Linking.addEventListener('url', ({ url }) => {
      const link = parseDeepLink(url);
      if (!link) return;

      if (link.path === 'join') {
        if (!isSignedIn) {
          setPendingDeepLink({ path: 'join', params: { hash: link.hash } });
          router.replace('/(auth)/sign-in');
          return;
        }
        if (pathname.includes('/join')) {
          router.setParams({ hash: link.hash });
        } else {
          router.push(`/(protected)/(modals)/join?hash=${link.hash}`);
        }
      }
    });

    return () => subscription.remove();
  }, [isLoaded, isSignedIn, isNavigationReady, pathname, router]);
}

function parseDeepLink(url: string): { path: string; hash: string } | null {
  const parsed = Linking.parse(url);
  const { path, queryParams } = parsed;

  // /i/:hash → join modal
  const inviteMatch = path?.match(/^i\/(.+)$/);
  if (inviteMatch) {
    return { path: 'join', hash: inviteMatch[1]! };
  }

  // Direct join link (fallback)
  if (path === 'join' && queryParams?.hash) {
    return { path: 'join', hash: queryParams.hash as string };
  }

  return null;
}
