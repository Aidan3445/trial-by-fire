import { useMemo } from 'react';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import { useQueryClient } from '@tanstack/react-query';
import { useIsEpisodeAiringForSeason } from '~/hooks/helpers/useIsEpisodeAiring';
import { type League } from '~/types/leagues';
import { useLocalSearchParams } from 'expo-router';

export function useLeagueRefresh(overrideHash?: string) {
  const params = useLocalSearchParams();
  const hash = overrideHash ?? (params.hash as string);
  const queryClient = useQueryClient();
  const isEpisodeAiring = useIsEpisodeAiringForSeason(
    queryClient.getQueryData<League>(['league', hash])?.seasonId ?? null
  );
  const { data: league } = useLeague(hash, isEpisodeAiring);

  const keysToInvalidate = useMemo(() => [
    ['league', league?.hash],
    ['leagueMembers', league?.hash],
    ['settings', league?.hash],
    ['rules', league?.hash],
    ['customEvents', league?.hash],
    ['basePredictions', league?.hash],
    ['predictionTiming', league?.hash],
    ['selectionTimeline', league?.hash],
    ['episodes', league?.seasonId],
    ['seasons', league?.seasonId],
  ], [league?.hash, league?.seasonId]);

  return { ...useRefresh(keysToInvalidate), league };
}
