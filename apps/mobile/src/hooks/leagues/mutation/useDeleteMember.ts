import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useDeleteMember() {
  const deleteData = useFetch('DELETE');
  const queryClient = useQueryClient();
  const { hash } = useLocalSearchParams<{ hash: string }>();

  const [isDeleting, setIsDeleting] = useState(false);

  const invalidateQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['league', hash] });
    await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });
    await queryClient.invalidateQueries({ queryKey: ['leagueMembers', 'pending', hash] });
  };

  const deleteMember = async (memberId: number): Promise<boolean> => {
    if (!hash) {
      Alert.alert('Error', 'League data not available');
      return false;
    }

    setIsDeleting(true);
    try {
      const response = await deleteData(`/api/leagues/${hash}/members`, {
        body: { memberId }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error removing member:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to remove member');
        return false;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to remove member');
        return false;
      }

      await invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error removing member:', error);
      Alert.alert('Error', 'An error occurred while removing the member');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  const rejectPendingMember = async (memberId: number): Promise<boolean> => {
    if (!hash) {
      Alert.alert('Error', 'League data not available');
      return false;
    }

    setIsDeleting(true);
    try {
      const response = await deleteData(`/api/leagues/${hash}/members/pending`, {
        body: { memberId }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error rejecting pending member:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to reject pending member');
        return false;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to reject pending member');
        return false;
      }

      await invalidateQueries();
      return true;
    } catch (error) {
      console.error('Error rejecting pending member:', error);
      Alert.alert('Error', 'An error occurred while rejecting the pending member');
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    deleteMember,
    rejectPendingMember,
    isDeleting
  };
}
