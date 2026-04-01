import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { useLeagueMembers } from '~/hooks/leagues/query/useLeagueMembers';
import { type SecondaryPickSettings, SecondaryPickSettingsZod } from '~/types/leagues';
import { defaultSecondaryPickSettings } from '~/lib/leagues';
import { useLocalSearchParams } from 'expo-router';

export function useSecondaryPickSettings() {
  const queryClient = useQueryClient();
  const putData = useFetch('PUT');
  const { hash } = useLocalSearchParams<{ hash: string }>();
  const { data: league } = useLeague();
  const { data: rules } = useLeagueRules();
  const { data: leagueMembers } = useLeagueMembers();

  const [locked, setLocked] = useState(true);

  const reactForm = useForm<SecondaryPickSettings>({
    defaultValues: {
      ...defaultSecondaryPickSettings,
      ...rules?.secondaryPick
    },
    resolver: zodResolver(SecondaryPickSettingsZod),
  });

  useEffect(() => {
    if (rules?.secondaryPick) {
      reactForm.reset({
        ...defaultSecondaryPickSettings,
        ...rules.secondaryPick
      });
    }
  }, [rules?.secondaryPick, reactForm]);

  const isOwner = leagueMembers?.loggedIn?.role === 'Owner';
  const isInactive = league?.status === 'Inactive';
  const editable = isOwner && !isInactive;
  const isDirty = reactForm.formState.isDirty;

  const unlock = () => setLocked(false);

  const lock = () => {
    setLocked(true);
    reactForm.reset();
  };

  const handleSubmit = reactForm.handleSubmit(async (data) => {
    if (!league) return;

    try {
      const response = await putData(`/api/leagues/${hash}/secondary/settings`, {
        body: {
          ...data,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        Alert.alert('Error', errorData.message || 'Failed to save settings');
        return;
      }

      await queryClient.invalidateQueries({ queryKey: ['rules', league.hash] });
      await queryClient.invalidateQueries({ queryKey: ['league', league.hash] });
      setLocked(true);
      reactForm.reset(data);
      Alert.alert('Success', 'Secondary Pick settings saved!');
    } catch (error) {
      console.error('Error saving secondary pick settings:', error);
      Alert.alert('Error', 'Failed to save Secondary Pick settings.');
    }
  });

  return {
    reactForm,
    locked,
    editable,
    isDirty,
    unlock,
    lock,
    handleSubmit,
  };
}
