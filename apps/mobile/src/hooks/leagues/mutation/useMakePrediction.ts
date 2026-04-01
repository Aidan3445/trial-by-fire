import { Alert } from 'react-native';
import { useUser } from '@clerk/expo';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { z } from 'zod';
import { type MakePrediction, type ReferenceType } from '~/types/events';

const formSchema = z.object({
  referenceId: z.coerce.number({ required_error: 'Please select an option' }),
  bet: z.coerce.number().nullable().optional(),
});

export function useMakePrediction(
  hash: string,
  prediction: MakePrediction,
  options: Record<ReferenceType | 'Direct Castaway', Record<string, { id: number; color: string; tribeName?: string }>>
) {
  const postData = useFetch('POST');
  const queryClient = useQueryClient();
  const { user } = useUser();

  const reactForm = useForm<z.infer<typeof formSchema>>({
    defaultValues: {
      referenceId: prediction.predictionMade?.referenceId,
      bet: prediction.predictionMade?.bet ?? undefined,
    },
    resolver: zodResolver(formSchema),
  });

  const handleSubmit = async (onSubmitSuccess?: () => void) =>
    reactForm.handleSubmit(async data => {
      if (!user) {
        Alert.alert('Error', 'You must be logged in to make a prediction');
        return;
      }

      try {
        // NOTE this breaks if ever there are a tribe and castaway with the same ID
        // that shouldn't happen for now but something to keep in mind
        let selectedType = Object.keys(options).find((type) =>
          Object.values(options[type as ReferenceType | 'Direct Castaway']).some(({ id }) =>
            id === data.referenceId)) as ReferenceType | 'Direct Castaway' | undefined;
        if (!selectedType) throw new Error('Invalid reference type');
        if (selectedType === 'Direct Castaway') selectedType = 'Castaway';

        const response = await postData(`/api/leagues/${hash}/predictions`, {
          body: {
            prediction: {
              eventSource: prediction.eventSource,
              eventName: prediction.eventName,
              referenceType: selectedType,
              referenceId: data.referenceId,
              bet: data.bet ?? null,
            }
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('Error making prediction:', errorData);
          Alert.alert('Error', errorData.message || 'Failed to make prediction');
          return;
        }

        const result = (await response.json()) as { success: boolean; wasUpdate: boolean };

        if (!result.success) throw new Error('Failed to make prediction');

        onSubmitSuccess?.();

        reactForm.reset(data);
        await queryClient.invalidateQueries({ queryKey: ['basePredictions', hash] });
        await queryClient.invalidateQueries({ queryKey: ['customEvents', hash] });

        Alert.alert('Success', result.wasUpdate ? 'Prediction updated!' : 'Prediction submitted!');
      } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to make prediction');
      }
    })();

  return { reactForm, handleSubmit };
}
