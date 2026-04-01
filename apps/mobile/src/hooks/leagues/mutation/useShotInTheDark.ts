import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useShotInTheDark() {
  const queryClient = useQueryClient();
  const postAction = useFetch('POST');
  const deleteAction = useFetch('DELETE');
  const { data: league } = useLeague();
  const leagueData = useLeagueData();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loggedInMemberId = leagueData.leagueMembers?.loggedIn?.memberId;
  const shotStatus = loggedInMemberId ? leagueData.shotInTheDarkStatus?.[loggedInMemberId] : null;
  const hasUsedThisSeason = loggedInMemberId
    ? leagueData.selectionTimeline?.shotInTheDark?.[loggedInMemberId]
    : false;
  const isPending = shotStatus?.status === 'pending';

  const previousEpisode = leagueData.keyEpisodes?.previousEpisode;
  const nextEpisode = leagueData.keyEpisodes?.nextEpisode;
  const isActivationWindow = previousEpisode?.airStatus !== 'Airing' && !!nextEpisode;

  // Determine visibility state
  const uiState = (() => {
    if (
      !league ||
      !leagueData.leagueSettings?.shotInTheDarkEnabled ||
      leagueData.leagueSettings.survivalCap === 0 ||
      !leagueData.leagueMembers?.loggedIn
    ) {
      return 'hidden';
    }

    if (hasUsedThisSeason && !isPending) {
      return 'used';
    }

    if (!isActivationWindow && !isPending) {
      return 'hidden';
    }

    if (isPending) {
      return 'pending';
    }

    return 'available';
  })();

  const handlePlay = async () => {
    if (!league) return;

    setShowConfirmation(false);
    setShowAnimation(true);
    setIsSubmitting(true);

    try {
      const response = await postAction(`/api/leagues/${league.hash}/shotInTheDark`);

      if (!response.ok) {
        throw new Error('Failed to play Shot in the Dark');
      }

      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', league.hash] });

      // Keep animation showing for 2 seconds
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        setShowAnimation(false);
        setIsSubmitting(false);
      }, 2000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to play';
      Alert.alert('Error', errorMessage);
      setShowAnimation(false);
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!league) return;
    setIsSubmitting(true);

    try {
      const response = await deleteAction(`/api/leagues/${league.hash}/shotInTheDark`);

      if (!response.ok) {
        throw new Error('Failed to cancel Shot in the Dark');
      }

      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', league.hash] });
      setIsSubmitting(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to cancel';
      Alert.alert('Error', errorMessage);
      setIsSubmitting(false);
    }
  };

  return {
    uiState,
    isPending,
    isSubmitting,
    showConfirmation,
    setShowConfirmation,
    showAnimation,
    handlePlay,
    handleCancel,
  };
}
