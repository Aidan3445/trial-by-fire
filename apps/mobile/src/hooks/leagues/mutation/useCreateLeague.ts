import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useUser } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { type LeagueInsert, LeagueInsertZod } from '~/types/leagues';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useCreateLeague(onSubmit?: () => void) {
  const postData = useFetch('POST');
  const fetchData = useFetch('GET');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();

  const reactForm = useForm<LeagueInsert>({
    defaultValues: {
      leagueName: '',
      member: {
        displayName: user?.username || '',
        color: ''
      }
    },
    resolver: zodResolver(LeagueInsertZod)
  });

  useEffect(() => {
    reactForm.setValue('member.displayName', user?.username ?? '');
  }, [user, reactForm]);

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a league');
      return;
    }
    try {
      const response = await postData('/api/leagues/create', {
        body: {
          ...data,
          newMember: data.member,
        }
      });
      if (response.status !== 201) {
        const errorData = await response.json();
        console.error('Error creating league:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to create league');
        return;
      }

      const { newHash } = (await response.json()) as { newHash: string };

      if (!newHash) throw new Error('Failed to create league');

      reactForm.reset();
      onSubmit?.();
      await queryClient.invalidateQueries({ queryKey: ['leagues'] });

      // now fetch the league to load details into cache
      const leagueResponse = await fetchData(`/api/leagues/${newHash}`);
      if (leagueResponse.status === 200) {
        const leagueData = await leagueResponse.json();
        await queryClient.setQueryData(['leagues', newHash], leagueData);
      }
      router.prefetch({ pathname: '/leagues/[hash]/predraft', params: { hash: newHash } });

      Alert.alert('Success', `League created: ${data.leagueName}`);
      router.dismissTo({ pathname: '/leagues/[hash]/predraft', params: { hash: newHash } });
      // eslint-disable-next-line no-undef
      setTimeout(() => router.push('/tutorial'), 1000);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to create league');
    }
  });

  return { reactForm, handleSubmit, isSubmitting: reactForm.formState.isSubmitting };
}
