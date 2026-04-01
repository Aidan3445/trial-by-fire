import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { useForm } from 'react-hook-form';
import { type LeagueDetailsUpdate, LeagueDetailsUpdateZod } from '~/types/leagues';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams } from 'expo-router';

export function useLeagueDetails(onSubmit?: () => void) {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: leagueSettings } = useLeagueSettings();

  const reactForm = useForm<LeagueDetailsUpdate>({
    defaultValues: {
      name: league?.name ?? '',
      isProtected: leagueSettings?.isProtected ?? true
    },
    resolver: zodResolver(LeagueDetailsUpdateZod)
  });

  useEffect(() => {
    if (league) reactForm.setValue('name', league.name);
    if (leagueSettings) reactForm.setValue('isProtected', leagueSettings.isProtected);
  }, [league, leagueSettings, reactForm]);

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!league || !hash) {
      Alert.alert('Error', 'League data not available');
      return;
    }

    try {
      const response = await putData(`/api/leagues/${hash}/settings`, {
        body: { name: data.name, isProtected: data.isProtected }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error updating league settings:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to update league settings');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to update league settings');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['league', hash] });
      await queryClient.invalidateQueries({ queryKey: ['settings', hash] });
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', hash] });

      reactForm.reset(data);
      onSubmit?.();
      Alert.alert('Success', `League settings updated for ${data.name}`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update league settings');
    }
  });

  const resetForm = () => {
    reactForm.reset({
      name: league?.name ?? '',
      isProtected: leagueSettings?.isProtected ?? true
    });
  };

  const editable =
    !!leagueMembers &&
    leagueMembers.loggedIn?.role === 'Owner' &&
    league?.status !== 'Inactive';

  return {
    reactForm,
    handleSubmit,
    resetForm,
    editable,
    isDirty: reactForm.formState.isDirty
  };
}
