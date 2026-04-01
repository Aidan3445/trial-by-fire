import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';

export function useRecreateLeague(hash: string, onSuccess?: () => void) {
  const postData = useFetch('POST');
  const fetchData = useFetch('GET');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sortedMemberScores, leagueMembers } = useLeagueData(hash);

  const [selectedMembers, setSelectedMembers] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const ownerLoggedIn = useMemo(() => {
    if (!leagueMembers?.loggedIn) return false;
    return leagueMembers.loggedIn.role === 'Owner';
  }, [leagueMembers]);

  // Initialize selected members when data loads
  useEffect(() => {
    if (sortedMemberScores) {
      setSelectedMembers(new Set(sortedMemberScores.map(({ member }) => member.memberId)));
    }
  }, [sortedMemberScores]);

  const toggleMember = (memberId: number, isLoggedIn: boolean) => {
    if (isLoggedIn) return;
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(memberId)) {
        newSet.delete(memberId);
      } else {
        newSet.add(memberId);
      }
      return newSet;
    });
  };

  const handleSubmit = async () => {
    if (!ownerLoggedIn) {
      Alert.alert('Error', 'Only the league owner can clone this league');
      return;
    }

    if (selectedMembers.size === 0) {
      Alert.alert('Error', 'Please select at least one member');
      return;
    }

    setIsSubmitting(true);

    try {
      // Sort selected members by score (losers first for draft order)
      const sortedSelectedMembers = sortedMemberScores
        .toReversed()
        .filter(({ member }) => selectedMembers.has(member.memberId))
        .map(({ member }) => member.memberId);

      const response = await postData(`/api/leagues/${hash}/recreate`, {
        body: { memberIds: sortedSelectedMembers },
      });

      if (response.status !== 201) {
        const errorData = await response.json();
        console.error('Error recreating league:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to clone league');
        return;
      }

      const { newHash } = (await response.json()) as { newHash: string };
      if (!newHash) throw new Error('Failed to clone league');

      await queryClient.invalidateQueries({ queryKey: ['leagues'] });

      // now fetch the league to load details into cache
      const leagueResponse = await fetchData(`/api/leagues/${newHash}`);
      if (leagueResponse.status === 200) {
        const leagueData = await leagueResponse.json();
        await queryClient.setQueryData(['leagues', newHash], leagueData);
      }
      router.prefetch({ pathname: '/leagues/[hash]/predraft', params: { hash: newHash } });

      onSuccess?.();
      Alert.alert('Success', 'League cloned successfully!');
      router.replace({ pathname: '/leagues/[hash]/predraft', params: { hash: newHash } });
    } catch (error) {
      console.error('Error recreating league:', error);
      Alert.alert('Error', 'Failed to clone league');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    sortedMemberScores,
    selectedMembers,
    toggleMember,
    handleSubmit,
    isSubmitting,
    ownerLoggedIn,
  };
}
