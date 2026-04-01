import { useEffect, useRef } from 'react';
import { useRouter, usePathname, useSegments, useRootNavigationState } from 'expo-router';
import { useAuth } from '@clerk/expo';
import * as Notifications from 'expo-notifications';
import {
  setPendingDeepLink,
  getPendingDeepLink,
  clearPendingDeepLink,
} from '~/lib/routing';
import { useLeagues } from '~/hooks/user/useLeagues';
import { type NotificationData } from '~/types/notifications';
import { useLiveScoringSession } from '~/hooks/user/useLiveScoringSession';
import { useLivePredictions } from '~/hooks/livePredictions/query/useLivePredictions';

/**
 * Handles notification tap routing
 * Place in the tabs layout alongside useDeepLinkHandler
 */
// Module-level so it persists across remounts from navigation
let lastHandledId: string | null = null;

export function useNotificationRouting() {
  const router = useRouter();
  const pathname = usePathname();
  const { data: leagues } = useLeagues();
  const segments = useSegments() as string[];
  const navigationState = useRootNavigationState();
  const { isSignedIn, isLoaded } = useAuth();

  const pathnameRef = useRef(pathname);

  const isNavigationReady = !!navigationState?.key;
  const inProtectedGroup = segments[0] === '(protected)';
  const inTabsGroup = segments[1] === '(tabs)';

  const { airingEpisode } = useLivePredictions();
  const { isOptedIn, optIn, isOptingIn } = useLiveScoringSession(airingEpisode?.episodeId);

  const isOptedInRef = useRef(isOptedIn);
  const isOptingInRef = useRef(isOptingIn);

  // Keep refs in sync
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    isOptedInRef.current = isOptedIn;
  }, [isOptedIn]);

  useEffect(() => {
    isOptingInRef.current = isOptingIn;
  }, [isOptingIn]);

  // Cold start: handle notification that launched the app
  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;

    const handleInitial = () => {
      const response = Notifications.getLastNotificationResponse();
      if (!response) return;

      const notifId = response.notification.request.identifier;
      if (notifId === lastHandledId) return;

      const data = response.notification.request.content.data as unknown as NotificationData;
      if (!data?.type) return;

      lastHandledId = notifId;

      if (!isSignedIn) {
        setPendingDeepLink({
          path: 'notification',
          params: { data: JSON.stringify(data) },
        });
        return;
      }

      router.replace('/(protected)/(tabs)');
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        void routeNotification(data);
      }, 150);
    };

    handleInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, isNavigationReady, router]);

  // Handle pending notification after auth
  useEffect(() => {
    if (!isLoaded || !isSignedIn || !isNavigationReady) return;
    if (!inProtectedGroup || !inTabsGroup) return;

    const pending = getPendingDeepLink();
    if (!pending || pending.path !== 'notification') return;

    clearPendingDeepLink();

    try {
      if (!pending.params.data) return;
      const data = JSON.parse(pending.params.data) as NotificationData;
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        void routeNotification(data);
      }, 150);
    } catch {
      console.error('Failed to parse pending notification data');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, isNavigationReady, inProtectedGroup, inTabsGroup, router]);

  // Warm start: handle taps while app is open/backgrounded
  useEffect(() => {
    if (!isLoaded || !isNavigationReady) return;

    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const notifId = response.notification.request.identifier;
      if (notifId === lastHandledId) return;

      const data = response.notification.request.content.data as unknown as NotificationData;
      if (!isSignedIn || !data?.type) return;

      lastHandledId = notifId;
      void routeNotification(data);
    });

    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, isSignedIn, isNavigationReady]);

  function navigateToLeague(leagueHash: string, subPath?: string) {
    // Don't push if already on this league page
    if (pathnameRef.current.includes(`/leagues/${leagueHash}${subPath ? `/${subPath}` : ''}`)) return;
    router.navigate(`/(protected)/(tabs)/leagues/${leagueHash}${subPath ? `/${subPath}` : ''}`);
  }

  function navigateToLeagues() {
    if (pathnameRef.current.endsWith('/leagues')) return;
    router.navigate('/(protected)/(tabs)/leagues');
  }

  async function routeNotification(data: NotificationData) {
    if (!data?.type) return;

    switch (data.type) {
      case 'league_admission':
        if (data.leagueHash) {
          navigateToLeague(data.leagueHash, 'predraft');
          // eslint-disable-next-line no-undef
          setTimeout(() => router.push('/tutorial?showCustomization=false'), 1000);
        }
        break;
      case 'member_joined':
      case 'draft_date_changed':
      case 'draft_date_changed_soon':
      case 'draft_reminder_1hr':
      case 'league_recreated':
        if (data.leagueHash) {
          navigateToLeague(data.leagueHash, 'predraft');
        }
        break;
      case 'draft_start':
        if (data.leagueHash) {
          navigateToLeague(data.leagueHash, 'draft');
        }
        break;
      case 'member_pending':
        if (data.leagueHash) {
          navigateToLeague(data.leagueHash, 'settings');
        }
        break;
      case 'selection_changed':
        if (data.leagueHash) {
          navigateToLeague(data.leagueHash);
        }
        break;

      case 'reminder':
      case 'reminder_secondary':
      case 'reminder_both':
      case 'episode_finished':
        navigateToLeagues();
        break;

      case 'live_scoring_optin':
        if (data.episodeId && !isOptedInRef.current && !isOptingInRef.current) {
          optIn();
        }
        break;
      case 'live_event':
        await handleLiveScoringTap(data);
        break;

      case 'live_prediction':
        if (data.episodeId) router.navigate('/live');
        break;
      default:
        console.log('Unhandled notification type:', data.type);
    }
  }

  async function handleLiveScoringTap(data: NotificationData) {
    const currentPath = pathnameRef.current;

    // If already on a league page, stay there
    if (currentPath.includes('/leagues/') && !currentPath.endsWith('/leagues')) {
      return;
    }

    // League-specific notification (custom events), go directly
    if (data.leagueHash) {
      navigateToLeague(data.leagueHash);
      return;
    }

    // Global live scoring — check how many active leagues
    if (!data.seasonId) {
      navigateToLeagues();
      return;
    }

    try {
      const activeSeasonLeagues = leagues?.filter(league =>
        league.league.seasonId === data.seasonId &&
        league.league.status === 'Active' &&
        league.memberCount > 0,
      );
      if (activeSeasonLeagues?.length === 1) {
        navigateToLeague(activeSeasonLeagues[0]!.league.hash);
      } else {
        navigateToLeagues();
      }
    } catch (error) {
      console.error('Failed to fetch active leagues for notification routing:', error);
      navigateToLeagues();
    }
  }
}
