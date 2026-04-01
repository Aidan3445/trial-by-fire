import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { defaultBaseRules, defaultBasePredictionRules } from '~/lib/leagues';
import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { BaseEventRulesZod, BasePredictionRulesZod } from '~/types/leagues';

const formSchema = z.object({
  baseEventRules: BaseEventRulesZod,
  basePredictionRules: BasePredictionRulesZod
});

export function useBaseEventRules() {
  const putData = useFetch('PUT');
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: rules } = useLeagueRules();
  const [locked, setLocked] = useState(true);

  const currentBaseRules = rules?.base ?? defaultBaseRules;
  const currentBasePredictionRules = rules?.basePrediction ?? defaultBasePredictionRules;

  const reactForm = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      baseEventRules: currentBaseRules,
      basePredictionRules: currentBasePredictionRules
    },
    resolver: zodResolver(formSchema)
  });

  useEffect(() => {
    reactForm.setValue('baseEventRules', currentBaseRules);
    reactForm.setValue('basePredictionRules', currentBasePredictionRules);
  }, [currentBaseRules, currentBasePredictionRules, reactForm]);

  const rulesChanged = reactForm.formState.isDirty;

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!league || !rulesChanged) return;

    try {
      const response = await putData(`/api/leagues/${league.hash}/rules/base`, {
        body: { baseRules: data.baseEventRules, predictionRules: data.basePredictionRules }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error saving scoring rules:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to save scoring rules');
        return;
      }

      const { success } = (await response.json()) as { success: boolean };
      if (!success) {
        Alert.alert('Error', 'Failed to save scoring rules');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      Alert.alert('Success', 'Scoring rules saved');
      setLocked(true);
      reactForm.reset(data); // Reset form with new values as default
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to save scoring rules');
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
    leagueMembers,
    disabled
  };
}
