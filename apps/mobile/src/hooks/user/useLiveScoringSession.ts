import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useLiveScoringSession(episodeId?: number) {
  const getData = useFetch();
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  const [isOptingIn, setIsOptingIn] = useState(false);

  const { data: isOptedIn = false } = useQuery<boolean>({
    queryKey: ['liveScoringSession', episodeId],
    queryFn: async () => {
      if (!episodeId) return false;
      const res = await getData(`/api/notifications/liveScoring?episodeId=${episodeId}`);
      if (!res.ok) return false;
      const data = await res.json();
      return data.optedIn === true;
    },
    enabled: !!episodeId,
  });

  const optIn = () => {
    if (!episodeId) return;
    void (async () => {
      setIsOptingIn(true);
      try {
        const res = await postData('/api/notifications/liveScoring', {
          body: { episodeId },
        });
        if (!res.ok) {
          const err = await res.json();
          Alert.alert('Error', err.message || 'Failed to opt in');
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ['liveScoringSession', episodeId] });
      } catch (error) {
        console.error('Error opting in to live scoring:', error);
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setIsOptingIn(false);
      }
    })();
  };

  return { isOptedIn, optIn, isOptingIn };
}
