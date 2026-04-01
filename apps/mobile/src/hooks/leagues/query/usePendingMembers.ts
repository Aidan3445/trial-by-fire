import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useIsEpisodeAiring } from '~/hooks/helpers/useIsEpisodeAiring';
import { useRefreshConfig } from '~/hooks/helpers/useRefreshConfig';
import { type PendingLeagueMember } from '~/types/leagueMembers';

/**
 * Fetches pending league members data from the API and provides admit functionality.
 * @param {string} overrideHash Optional hash to override the URL parameter.
 * @returnObj `PendingLeagueMember[]` and `admitMember` function
 */
export function usePendingMembers(overrideHash?: string) {
  const fetchData = useFetch('GET');
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const hash = overrideHash ?? (params?.hash as string);
  const isEpisodeAiring = useIsEpisodeAiring(overrideHash);
  const refreshConfig = useRefreshConfig(isEpisodeAiring, true, overrideHash);

  const [isAdmitting, setIsAdmitting] = useState(false);

  const query = useQuery<{ members: PendingLeagueMember[] }>({
    queryKey: ['leagueMembers', 'pending', hash],
    queryFn: async () => {
      if (!hash) throw new Error('League hash is required');
      const res = await fetchData(`/api/leagues/${hash}/members/pending`);
      if (!res.ok) {
        throw new Error('Failed to fetch leagueMembers data');
      }
      const { leagueMembers } = (await res.json()) as { leagueMembers: PendingLeagueMember[] };
      return { members: leagueMembers };
    },
    enabled: !!hash,
    ...refreshConfig
  });

  const admitMember = async (memberId: number): Promise<boolean> => {
    if (!hash) {
      Alert.alert('Error', 'League data not available');
      return false;
    }

    setIsAdmitting(true);
    try {
      const response = await putData(`/api/leagues/${hash}/members/pending`, {
        body: { pendingMemberId: memberId }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error admitting member:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to admit member');
        return false;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to admit member');
        return false;
      }

      await queryClient.invalidateQueries({ queryKey: ['league', hash] });
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', 'pending', hash] });

      return true;
    } catch (error) {
      console.error('Error admitting member:', error);
      Alert.alert('Error', 'An error occurred while admitting the member');
      return false;
    } finally {
      setIsAdmitting(false);
    }
  };

  return {
    ...query,
    admitMember,
    isAdmitting
  };
}
