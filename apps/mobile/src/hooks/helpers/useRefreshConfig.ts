import { useIsFocused } from '@react-navigation/native';
import { useMemo } from 'react';
import { useLeague } from '~/hooks/leagues/query/useLeague';

/**
 * Hook to get dynamic refresh configuration based on episode airing status
 * @param {boolean} isEpisodeAiring Whether an episode is currently airing
 * @param {boolean} requireFocus Whether to require screen focus for refetching
 * @param {string} [overrideHash] Optional hash to override URL parameter
 */
export function useRefreshConfig(
  isEpisodeAiring: boolean,
  requireFocus: boolean,
  overrideHash?: string
) {
  const isFocused = useIsFocused();
  const { data: league } = useLeague(overrideHash);

  return useMemo(() => {
    if (league?.status === 'Predraft' || league?.status === 'Draft') {
      return {
        staleTime: 15 * 1000, // 15 seconds
        refetchInterval: 30 * 1000, // 30 seconds
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        gcTime: 30 * 60 * 1000, // 30 minutes
        ...(requireFocus && { enabled: isFocused })
      };
    }

    if (isEpisodeAiring) {
      return {
        staleTime: 30 * 1000, // 30 seconds
        refetchInterval: 60 * 1000, // 1 minute
        refetchOnWindowFocus: true,
        refetchOnReconnect: true,
        gcTime: 3 * 60 * 1000, // 3 minutes
        ...(requireFocus && { enabled: isFocused })
      };
    } else {
      return {
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchInterval: 10 * 60 * 1000, // 10 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        gcTime: 30 * 60 * 1000, // 30 minutes
        ...(requireFocus && { enabled: isFocused })
      };
    }
  }, [isEpisodeAiring, isFocused, league?.status, requireFocus]);
}
