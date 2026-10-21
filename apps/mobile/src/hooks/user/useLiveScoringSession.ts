import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-native';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useLiveScoringSession(episodeId?: number) {
  const getData = useFetch();
  const postData = useFetch('POST');
  const deleteData = useFetch('DELETE');
  const queryClient = useQueryClient();
  const [isUpdating, setIsUpdating] = useState(false);

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

  const setOptedIn = (optedIn: boolean) => {
    if (!episodeId) return;
    void (async () => {
      setIsUpdating(true);
      try {
        const send = optedIn ? postData : deleteData;
        const res = await send('/api/notifications/liveScoring', {
          body: { episodeId },
        });
        if (!res.ok) {
          const err = await res.json();
          Alert.alert('Error', err.message || `Failed to turn ${optedIn ? 'on' : 'off'} live scoring`);
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ['liveScoringSession', episodeId] });
      } catch (error) {
        console.error('Error updating live scoring:', error);
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setIsUpdating(false);
      }
    })();
  };

  return {
    isOptedIn,
    optIn: () => setOptedIn(true),
    optOut: () => setOptedIn(false),
    isUpdating,
  };
}
