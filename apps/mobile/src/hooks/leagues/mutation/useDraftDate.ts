import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { useLeague } from '~/hooks/leagues/query/useLeague';

const DraftDateUpdateSchema = z.object({ draftDate: z.date().nullable() });

type DraftDateUpdate = z.infer<typeof DraftDateUpdateSchema>;

export function useDraftDate(overrideHash?: string, onSubmit?: () => void) {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const params = useLocalSearchParams<{ hash: string }>();
  const hash = overrideHash ?? params.hash;
  const { data: league } = useLeague();
  const { data: leagueSettings } = useLeagueSettings();
  const { data: leagueMembers } = useLeagueMembers();

  const reactForm = useForm<DraftDateUpdate>({
    defaultValues: {
      draftDate: leagueSettings?.draftDate ? new Date(leagueSettings.draftDate) : null
    },
    resolver: zodResolver(DraftDateUpdateSchema)
  });

  useEffect(() => {
    if (leagueSettings?.draftDate) {
      reactForm.setValue('draftDate', new Date(leagueSettings.draftDate));
    }
  }, [leagueSettings, reactForm]);

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!hash) {
      Alert.alert('Error', 'League data not available');
      return;
    }

    try {
      const response = await putData(`/api/leagues/${hash}/settings`, {
        body: { draftDate: data.draftDate }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error updating draft date:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to update draft date');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to update draft date');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['league', hash] });
      await queryClient.invalidateQueries({ queryKey: ['settings', hash] });

      reactForm.reset(data);
      onSubmit?.();
      Alert.alert('Success', 'Draft date updated successfully');
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update draft date');
    }
  });

  const resetForm = () => {
    if (leagueSettings?.draftDate) {
      reactForm.reset({ draftDate: new Date(leagueSettings.draftDate) });
    } else {
      reactForm.reset({ draftDate: new Date() });
    }
  };

  const editable =
    !!leagueMembers && leagueMembers.loggedIn?.role === 'Owner' && league?.status !== 'Inactive';

  return { reactForm, handleSubmit, resetForm, editable };
}
