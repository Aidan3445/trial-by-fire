import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useForm } from 'react-hook-form';
import { LeagueMemberInsertZod, type LeagueMemberInsert } from '~/types/leagueMembers';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useLeagueColors } from '~/hooks/leagues/query/useLeagueColors';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';

export function useEditMember(onSubmit?: () => void) {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: usedColors } = useLeagueColors();

  const reactForm = useForm<LeagueMemberInsert>({
    defaultValues: { displayName: '', color: '' },
    resolver: zodResolver(LeagueMemberInsertZod)
  });

  useEffect(() => {
    if (leagueMembers?.loggedIn) {
      reactForm.setValue('displayName', leagueMembers.loggedIn.displayName || '');
      reactForm.setValue('color', leagueMembers.loggedIn.color || '');
    }
  }, [leagueMembers?.loggedIn, reactForm]);

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!leagueMembers?.loggedIn || !hash) {
      Alert.alert('Error', 'You must be logged in to edit your member details');
      return;
    }
    try {
      const response = await putData(`/api/leagues/${hash}/members`, { body: { member: data } });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error updating member details:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to update member details');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to update member details');
        return;
      }
      reactForm.reset(data);
      onSubmit?.();
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });
      Alert.alert('Success', 'Member details updated');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update member details');
    }
  });

  const resetForm = () => {
    if (leagueMembers?.loggedIn) {
      reactForm.reset({
        displayName: leagueMembers.loggedIn.displayName || '',
        color: leagueMembers.loggedIn.color || ''
      });
    } else {
      reactForm.reset();
    }
  };

  return {
    reactForm,
    handleSubmit,
    usedColors,
    currentColor: leagueMembers?.loggedIn?.color,
    resetForm,
    isDirty: reactForm.formState.isDirty,
    loggedInMember: leagueMembers?.loggedIn
  };
}
