import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMemberRole } from '~/types/leagueMembers';

export function useMemberRole() {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { hash } = useLocalSearchParams<{ hash: string }>();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRole = async (memberId: number, role: LeagueMemberRole): Promise<boolean> => {
    if (!hash) {
      Alert.alert('Error', 'League data not available');
      return false;
    }

    setIsSubmitting(true);
    try {
      const response = await putData(`/api/leagues/${hash}/members/role`, {
        body: { memberId, role }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error updating member role:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to update member role');
        return false;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to update member role');
        return false;
      }

      await queryClient.invalidateQueries({ queryKey: ['league', hash] });
      await queryClient.invalidateQueries({ queryKey: ['settings', hash] });
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });

      return true;
    } catch (error) {
      console.error('Error updating member role:', error);
      Alert.alert('Error', 'An error occurred while updating the member role');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    updateRole,
    isSubmitting
  };
}
