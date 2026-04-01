import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueSettings } from '~/hooks/leagues/query/useLeagueSettings';
import { DEFAULT_SURVIVAL_CAP } from '~/lib/leagues';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LeagueSurvivalUpdateZod, type LeagueSurvivalUpdate } from '~/types/leagues';

export function useSurvivalStreak() {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: settings } = useLeagueSettings();
  const [locked, setLocked] = useState(true);

  const reactForm = useForm<LeagueSurvivalUpdate>({
    defaultValues: {
      survivalCap: settings?.survivalCap ?? DEFAULT_SURVIVAL_CAP,
      preserveStreak: settings?.preserveStreak ?? true,
      shotInTheDarkEnabled: settings?.shotInTheDarkEnabled ?? false
    },
    resolver: zodResolver(LeagueSurvivalUpdateZod)
  });

  useEffect(() => {
    reactForm.setValue('survivalCap', settings?.survivalCap ?? DEFAULT_SURVIVAL_CAP);
    reactForm.setValue('preserveStreak', settings?.preserveStreak ?? true);
    reactForm.setValue('shotInTheDarkEnabled', settings?.shotInTheDarkEnabled ?? false);
  }, [settings?.survivalCap, settings?.preserveStreak, reactForm, settings?.shotInTheDarkEnabled]);

  const settingsChanged = reactForm.formState.isDirty;

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!league || !settingsChanged) return;

    try {
      const response = await putData(`/api/leagues/${league.hash}/settings`, { body: data });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error saving survival streak settings:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to save survival streak settings');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to save survival streak settings');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['leagueSettings', league.hash] });
      Alert.alert('Success', 'Survival streak settings saved');
      setLocked(true);
      reactForm.reset(data); // Reset form with new values as default
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save survival streak settings');
    }
  });

  const disabled = useMemo(() => (!!leagueMembers && leagueMembers.loggedIn?.role !== 'Owner')
    || league?.status === 'Inactive',
    [leagueMembers, league]);


  const resetSettings = () => {
    reactForm.reset();
    setLocked(true);
  };

  return {
    reactForm,
    locked,
    setLocked,
    settingsChanged,
    handleSubmit,
    resetSettings,
    leagueMembers,
    disabled
  };
}
