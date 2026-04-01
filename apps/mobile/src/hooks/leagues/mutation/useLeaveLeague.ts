import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMember } from '~/types/leagueMembers';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';

export function useLeaveLeague(member?: LeagueMember) {
  const { keysToInvalidate } = useLeagueRefresh();
  const router = useRouter();
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const queryClient = useQueryClient();
  const deleteData = useFetch('DELETE');
  const [isOpen, setIsOpen] = useState(false);

  const isOwner = member?.role === 'Owner';

  const handleLeaveLeague = () => {
    if (!member || !hash || isOwner) return;

    void (async () => {
      try {
        const response = await deleteData(`/api/leagues/${hash}/members/leave`);
        if (!response.ok) {
          const errorData = await response.json();
          Alert.alert('Error', errorData.message || 'Failed to leave league');
          return;
        }

        await Promise.all(
          keysToInvalidate.map((key) => queryClient.cancelQueries({ queryKey: key }))
        );
        await queryClient.invalidateQueries({ queryKey: ['leagues'] });
        keysToInvalidate.forEach((key) => queryClient.removeQueries({ queryKey: key }));

        setIsOpen(false);
        router.replace('/leagues');

        Alert.alert('Success', 'You have left the league.');
      } catch (error) {
        console.error('Error leaving league:', error);
        Alert.alert('Error', 'An error occurred while leaving the league.');
      }
    })();
  };

  return {
    isOpen,
    isOwner,

    setIsOpen,
    handleLeaveLeague,
  };
}
