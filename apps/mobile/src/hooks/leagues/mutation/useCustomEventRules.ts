import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { type CustomEventRuleInsert, CustomEventRuleInsertZod } from '~/types/leagues';
import { defaultNewCustomRule } from '~/lib/leagues';

export function useCustomEventRules() {
  const fetchData = useFetch('GET');
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const { data: leagueMembers } = useLeagueMembers();
  const { data: rules } = useLeagueRules();
  const [locked, setLocked] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const reactForm = useForm<CustomEventRuleInsert>({
    defaultValues: defaultNewCustomRule,
    resolver: zodResolver(CustomEventRuleInsertZod)
  });

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!league) return;

    try {
      const response = await fetchData(`/api/leagues/${league.hash}/rules/custom`, {
        method: 'POST',
        body: { rule: data }
      });

      if (response.status !== 201) {
        const errorData = await response.json();
        console.error('Error creating custom event:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to create custom event');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      Alert.alert('Success', `Custom event ${data.eventName} created`);
      reactForm.reset();
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create custom event');
    }
  });

  const updateCustomEvent = async (data: CustomEventRuleInsert, ruleId: number) => {
    if (!league) return;

    try {
      const response = await fetchData(`/api/leagues/${league.hash}/rules/custom`, {
        method: 'PUT',
        body: { rule: data, ruleId }
      });

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error updating custom event:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to update custom event');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      Alert.alert('Success', `Custom event ${data.eventName} updated`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to update custom event');
    }
  };

  const deleteCustomEvent = async (ruleId: number, eventName: string) => {
    if (!league) return;

    try {
      const response = await fetchData(
        `/api/leagues/${league.hash}/rules/custom?ruleId=${ruleId}`,
        { method: 'DELETE' }
      );

      if (response.status !== 200) {
        const errorData = await response.json();
        console.error('Error deleting custom event:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to delete custom event');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      Alert.alert('Success', `Custom event ${eventName} deleted`);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to delete custom event');
    }
  };

  const disabled =
    (!!leagueMembers?.loggedIn && leagueMembers.loggedIn.role !== 'Owner')
    || league?.status === 'Inactive';

  return {
    reactForm,
    locked,
    setLocked,
    modalOpen,
    setModalOpen,
    handleSubmit,
    updateCustomEvent,
    deleteCustomEvent,
    disabled,
    customRules: rules?.custom || [],
    leagueMembers
  };
}
