import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';

export function useRespondLivePrediction(episodeId: number | undefined) {
  const queryClient = useQueryClient();
  const postData = useFetch('POST');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const respond = (livePredictionId: number, optionId: number) => {
    void (async () => {
      setIsSubmitting(true);
      try {
        const res = await postData(`/api/live/${livePredictionId}`, {
          body: { optionId },
        });
        if (!res.ok) {
          const err = await res.json();
          Alert.alert('Error', err.message || 'Failed to submit response');
          return;
        }
        await queryClient.invalidateQueries({ queryKey: ['livePredictions', episodeId] });
      } catch (error) {
        console.error('Error responding to live prediction:', error);
        Alert.alert('Error', 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    })();
  };

  return { respond, isSubmitting };
}
