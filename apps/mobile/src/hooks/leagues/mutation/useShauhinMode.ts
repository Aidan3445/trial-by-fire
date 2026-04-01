import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { type ShauhinModeSettings, ShauhinModeSettingsZod } from '~/types/leagues';
import { defaultShauhinModeSettings } from '~/lib/leagues';

export function useShauhinMode() {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: rules } = useLeagueRules();
  const [locked, setLocked] = useState(true);

  const reactForm = useForm<ShauhinModeSettings>({
    defaultValues: rules?.shauhinMode ?? defaultShauhinModeSettings,
    resolver: zodResolver(ShauhinModeSettingsZod)
  });

  useEffect(() => {
    const defaults = defaultShauhinModeSettings;

    if (rules && !rules.shauhinMode) {
      // Ensure that default shauhin mode settings are valid with current rules
      defaults.enabledBets = defaults.enabledBets.filter(
        bet => rules.basePrediction?.[bet]?.enabled
      );
    }

    const settings = rules?.shauhinMode ?? defaultShauhinModeSettings;
    reactForm.reset(settings);
  }, [rules?.shauhinMode, reactForm, rules]);

  const rulesChanged = reactForm.formState.isDirty;

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!league || !rulesChanged) return;

    try {
      const response = await putData(`/api/leagues/${league.hash}/rules/shauhinMode`, {
        body: { shauhinMode: data }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error saving Shauhin Mode settings:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to save Shauhin Mode settings');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to save Shauhin Mode settings');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      Alert.alert('Success', 'Shauhin Mode settings saved successfully!');
      setLocked(true);
      reactForm.reset(data); // Reset form with new values as default
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save Shauhin Mode settings');
    }
  });

  const resetSettings = () => {
    reactForm.reset();
    setLocked(true);
  };

  const disabled =
    (!!leagueMembers && leagueMembers.loggedIn?.role !== 'Owner') || league?.status === 'Inactive';

  return {
    reactForm,
    locked,
    setLocked,
    rulesChanged,
    handleSubmit,
    resetSettings,
    disabled,
    rules
  };
}
