import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueRefresh } from '~/hooks/helpers/refresh/useLeagueRefresh';

export function useDeleteLeague() {
  const { keysToInvalidate } = useLeagueRefresh();
  const deleteData = useFetch('DELETE');
  const queryClient = useQueryClient();
  const router = useRouter();
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();

  const [confirmName, setConfirmName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwner = leagueMembers?.loggedIn?.role === 'Owner';
  const isInactive = league?.status === 'Inactive';
  const canDelete = confirmName === league?.name && !isInactive && !isSubmitting;

  const performDelete = async () => {
    if (!league || !hash) return;

    setIsSubmitting(true);
    try {
      const response = await deleteData(`/api/leagues/${hash}`);

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error deleting league:', errorData);
        Alert.alert('Error', 'Failed to delete league. Please try again.');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to delete league. Please try again.');
        return;
      }

      await Promise.all(
        keysToInvalidate.map((key) => queryClient.cancelQueries({ queryKey: key }))
      );
      keysToInvalidate.map(key => queryClient.removeQueries({ queryKey: key }));
      await queryClient.invalidateQueries({ queryKey: ['leagues'] });
      await queryClient.invalidateQueries({ queryKey: ['league', hash] });

      router.replace('/');
      Alert.alert('Success', `League "${league.name}" has been deleted.`);
    } catch (error) {
      console.error('Failed to delete league', error);
      Alert.alert('Error', 'An error occurred while deleting the league.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = () => {
    if (!league || !hash || !canDelete) return;

    Alert.alert(
      'Delete League',
      `Are you absolutely sure you want to delete "${league.name}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => void performDelete()
        }
      ]
    );
  };

  const resetConfirmation = () => {
    setConfirmName('');
  };

  return {
    league,
    confirmName,
    setConfirmName,
    isSubmitting,
    isOwner,
    isInactive,
    canDelete,
    handleDelete,
    resetConfirmation
  };
}
