import { Alert } from 'react-native';
import { useUser } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { z } from 'zod';
import * as StoreReview from 'expo-store-review';

const formSchema = z.object({
  castawayId: z.coerce.number({ required_error: 'Please select a castaway' }),
});

export function useChooseCastaway(hash: string) {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  const { user } = useUser();
  const reactForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = reactForm.handleSubmit(async data => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to choose a castaway');
      return;
    }

    try {
      const response = await postData(`/api/leagues/${hash}/chooseCastaway`, {
        body: { hash, castawayId: data.castawayId }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error choosing castaway:', errorData);
        Alert.alert('Error', errorData.message || 'Failed to choose castaway');
        return;
      }

      const result = (await response.json()) as { success: boolean; draftComplete?: boolean };

      if (!result.success) throw new Error('Failed to choose castaway');

      reactForm.reset();
      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', hash] });
      await queryClient.invalidateQueries({ queryKey: ['league', hash] });

      if (result.draftComplete) {
        Alert.alert('Draft Complete!', 'All members have made their selections. The league is now active!');
      } else {
        Alert.alert('Success', 'Castaway chosen successfully');
      }

      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to choose castaway');
    }
  });

  return { reactForm, handleSubmit };
}
