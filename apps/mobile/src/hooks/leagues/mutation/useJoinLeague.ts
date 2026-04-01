import { useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useUser } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMemberInsert, LeagueMemberInsertZod } from '~/types/leagueMembers';
import { type PublicLeague } from '~/types/leagues';

export function useJoinLeague(onSubmit?: () => void) {
  const postData = useFetch('POST');
  const fetchData = useFetch('GET');
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const { hash } = useLocalSearchParams<{ hash: string }>();

  // Separate input state from query state
  const [inputValue, setInputValue] = useState('');
  const [submittedHash, setSubmittedHash] = useState<string | null>(null);

  const reactForm = useForm<LeagueMemberInsert>({
    defaultValues: { displayName: user?.username || '', color: '' },
    resolver: zodResolver(LeagueMemberInsertZod),
  });

  const parseCode = (input: string) => {
    const match = /(?:\?hash=|\/i\/)([A-Za-z0-9-_]+)/.exec(input);
    return match?.[1] ?? input;
  };

  // Handle typing in the input
  const handleInputChange = (input: string) => {
    const parsed = parseCode(input);
    setInputValue(parsed);
  };

  // Handle advancing to next step (submit the hash for querying)
  const submitHash = () => {
    const trimmed = inputValue.trim();
    if (trimmed) {
      setSubmittedHash(trimmed);
      router.setParams({ hash: trimmed });
    }
  };

  // Reset back to hash entry
  const resetHash = () => {
    setSubmittedHash(null);
    setInputValue('');
    router.setParams({ hash: '' });
  };

  // When hash comes from URL params (deep link), auto-submit it
  useEffect(() => {
    if (hash) {
      const parsed = parseCode(hash);
      setInputValue(parsed);
      setSubmittedHash(parsed);
    }
  }, [hash]);

  useEffect(() => {
    reactForm.setValue('displayName', user?.username ?? '');
  }, [user, reactForm]);

  // Only query when we have a submitted hash
  const getPublicLeague = useQuery<PublicLeague>({
    queryKey: ['publicLeague', submittedHash],
    queryFn: async () => {
      if (!submittedHash) throw new Error('League hash is required');

      const response = await fetchData(`/api/leagues/join?hash=${submittedHash}`);
      if (!response.ok) {
        throw new Error('Failed to fetch league');
      }
      return response.json();
    },
    enabled: !!submittedHash,
    gcTime: 0,
    staleTime: 0,
    retry: false,
  });

  const handleSubmit = reactForm.handleSubmit(async (data) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a league');
      return;
    }
    if (!getPublicLeague.data || !submittedHash) {
      Alert.alert('Error', 'League not found');
      return;
    }
    try {
      const response = await postData('/api/leagues/join', {
        body: { hash: submittedHash, newMember: data },
      });
      if (response.status === 409) {
        const errorData = await response.json();
        console.error('Conflict joining league:', errorData);
        Alert.alert('Error', errorData.message || 'You are already a member of this league');
        router.dismissTo(`/leagues/${submittedHash}`);
        return;
      }
      if (response.status !== 201) {
        const errorData = await response.json();
        console.error('Error joining league:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to join league');
        return;
      }

      const { success, admitted } = (await response.json()) as { success: boolean, admitted?: boolean };

      if (!success) throw new Error('Failed to join league');

      reactForm.reset();
      onSubmit?.();

      if (admitted) {
        await queryClient.invalidateQueries({ queryKey: ['leagues'] });

        const leagueResponse = await fetchData(`/api/leagues/${submittedHash}`);
        if (leagueResponse.status === 200) {
          const leagueData = await leagueResponse.json();
          await queryClient.setQueryData(['leagues', submittedHash], leagueData);
        }
        router.prefetch({ pathname: '/leagues/[hash]/predraft', params: { hash: submittedHash } });
        router.dismissTo(`/leagues/${submittedHash}/predraft`);
        // eslint-disable-next-line no-undef
        setTimeout(() => router.push('/tutorial?showCustomization=false'), 1000);

        Alert.alert('Success', `League Joined: ${getPublicLeague.data.name}`);
      } else {
        await queryClient.invalidateQueries({ queryKey: ['pendingLeagues'] });
        Alert.alert('Pending', `Your request to join "${getPublicLeague.data.name}" is pending approval from the league admin.`);
        router.dismissTo('/leagues');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to join league');
    }
  });

  return {
    reactForm,
    inputValue,
    handleInputChange,
    submitHash,
    resetHash,
    hasSubmittedHash: !!submittedHash,
    getPublicLeague,
    isSubmitting: reactForm.formState.isSubmitting,
    handleSubmit,
  };
}
