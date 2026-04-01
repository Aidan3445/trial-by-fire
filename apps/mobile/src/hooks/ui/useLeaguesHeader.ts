import { useCallback, useMemo, useRef } from 'react';
import { useRouter, usePathname } from 'expo-router';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useAnimatedVisibility } from '~/hooks/ui/useAnimatedVisibility';

export default function useLeaguesHeader() {
  const height = useHeaderHeight();
  const router = useRouter();
  const pathname = usePathname();

  // Parse route info
  const hashFromPath = useMemo(() => {
    const match = pathname.match(/leagues\/([a-zA-Z0-9_-]+)/);
    return match?.[1];
  }, [pathname]);

  const { data: league } = useLeague(hashFromPath);

  // Page state flags
  const pageState = useMemo(() => {
    const isIndex = pathname === '/leagues';
    const isPredraft = pathname.includes('/predraft');
    const isDraft = pathname.includes('/draft');
    const isSettings = pathname.includes('/settings');
    const isModal = !pathname.includes('leagues');
    const isCastawaysModal = pathname.includes('castaways');

    // Hub is now any [hash] route that isn't predraft/draft/settings
    const isLeagueHub = !!hashFromPath && !isPredraft && !isDraft && !isSettings;

    return {
      isModal,
      isCastawaysModal,
      isIndex,
      isPredraft,
      isDraft,
      isSettings,
      isLeagueHub,
    };
  }, [pathname, hashFromPath]);

  const { isModal, isCastawaysModal, isIndex, isPredraft, isDraft, isSettings, isLeagueHub } = pageState;

  // Button visibility
  const showBack = !isModal && (isPredraft || isDraft || isLeagueHub || isSettings);
  const showSettings = !isModal && (isPredraft || isLeagueHub);
  const showUsers = isDraft || isCastawaysModal;
  const showTutorial = isIndex || isSettings;

  // Animated opacities
  const backOpacity = useAnimatedVisibility(showBack);
  const settingsOpacity = useAnimatedVisibility(showSettings);
  const usersOpacity = useAnimatedVisibility(showUsers);
  const tutorialOpacity = useAnimatedVisibility(showTutorial);

  // Title logic
  const lastNonModalTitle = useRef('My Leagues');

  const title = useMemo(() => {
    if (isModal) return lastNonModalTitle.current;

    let newTitle = 'My Leagues';
    if (isSettings) newTitle = 'League Settings';
    else if (!isIndex) newTitle = league?.name ?? 'Loading...';

    lastNonModalTitle.current = newTitle;
    return newTitle;
  }, [isModal, isIndex, isSettings, league?.name]);

  // Navigation handlers
  const handleBackPress = useCallback(() => {
    router.canGoBack() ? router.back() : router.replace('/leagues');
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    if (hashFromPath) router.push(`/leagues/${hashFromPath}/settings`);
  }, [router, hashFromPath]);

  const handleUsersPress = useCallback(() => {
    if (hashFromPath) router.push(`/castaways?hash=${hashFromPath}`);
  }, [router, hashFromPath]);

  const handleTutorialPress = useCallback(() => {
    router.push('/tutorial');
  }, [router]);

  return {
    height,
    title,
    buttons: {
      back: { opacity: backOpacity, enabled: showBack, onPress: handleBackPress },
      settings: { opacity: settingsOpacity, enabled: showSettings, onPress: handleSettingsPress },
      users: { opacity: usersOpacity, enabled: showUsers, onPress: handleUsersPress },
      tutorial: { opacity: tutorialOpacity, enabled: showTutorial, onPress: handleTutorialPress },
    },
  };
}
