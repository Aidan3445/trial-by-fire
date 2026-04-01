import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { useEventOptions } from '~/hooks/seasons/enrich/useEventOptions';
import {
  type LivePredictionOptionInput,
  type LivePredictionOptionType,
  type LivePredictionTemplate,
} from '~/types/events';
import { type SeasonsDataQuery } from '~/types/seasons';
import { LIVE_PREDICTION_TEMPLATES } from '~/lib/events';

interface CreateLivePredictionForm {
  episodeId: number | undefined;
  title: string;
  description: string;
  optionType: LivePredictionOptionType;
  options: LivePredictionOptionInput[];
}

export function useCreateLivePrediction(seasonData: SeasonsDataQuery | null) {
  const queryClient = useQueryClient();
  const postData = useFetch('POST');
  const seasonId = seasonData?.season.seasonId ?? null;
  const { data: episodes } = useEpisodes(seasonId);

  const form = useForm<CreateLivePredictionForm>({
    defaultValues: {
      episodeId:
        episodes?.find((ep) => ep.airStatus === 'Airing')?.episodeId ??
        episodes?.findLast((ep) => ep.airStatus === 'Aired')?.episodeId ??
        episodes?.[0]?.episodeId,
      title: '',
      description: '',
      optionType: 'Castaway',
      options: [],
    },
  });

  const selectedEpisodeId = form.watch('episodeId');
  const optionType = form.watch('optionType');
  const options = form.watch('options');
  const title = form.watch('title');

  const selectedEpisode = useMemo(() =>
    episodes?.find((ep) => ep.episodeId === selectedEpisodeId)?.episodeNumber ?? 1,
    [episodes, selectedEpisodeId]
  );

  // Reference options for populating castaway/tribe options
  const { combinedReferenceOptions } = useEventOptions(seasonId, selectedEpisode);

  const castawayOptions = useMemo(() =>
    combinedReferenceOptions
      .filter((o) => o.value?.startsWith('Castaway_'))
      .map((o) => ({
        label: o.label,
        referenceType: 'Castaway' as const,
        referenceId: Number(o.value?.split('_')[1]),
      })),
    [combinedReferenceOptions]
  );

  const tribeOptions = useMemo(() =>
    combinedReferenceOptions
      .filter((o) => o.value?.startsWith('Tribe_'))
      .map((o) => ({
        label: o.label,
        referenceType: 'Tribe' as const,
        referenceId: Number(o.value?.split('_')[1]),
      })),
    [combinedReferenceOptions]
  );

  // Auto-populate options when type changes
  const setOptionType = useCallback((type: LivePredictionOptionType) => {
    form.setValue('optionType', type);
    if (type === 'Castaway') {
      form.setValue('options', castawayOptions);
    } else if (type === 'Tribe') {
      form.setValue('options', tribeOptions);
    } else {
      form.setValue('options', []);
    }
  }, [form, castawayOptions, tribeOptions]);

  // Apply a template
  const applyTemplate = useCallback((template: LivePredictionTemplate) => {
    form.setValue('title', template.title);
    form.setValue('description', template.description ?? '');
    setOptionType(template.optionType);
  }, [form, setOptionType]);

  // Custom option management
  const addCustomOption = useCallback((label: string) => {
    const current = form.getValues('options');
    form.setValue('options', [...current, { label }]);
  }, [form]);

  const removeCustomOption = useCallback((index: number) => {
    const current = form.getValues('options');
    form.setValue('options', current.filter((_, i) => i !== index));
  }, [form]);

  const updateCustomOption = useCallback((index: number, label: string) => {
    const current = form.getValues('options');
    form.setValue('options', current.map((o, i) => i === index ? { ...o, label } : o));
  }, [form]);

  // Episode options for select
  const episodeOptions = useMemo(() =>
    episodes?.map((ep) => ({
      value: ep.episodeId,
      label: `EP ${ep.episodeNumber}: ${ep.title}`,
    })) ?? [],
    [episodes]
  );

  // Option type options for select
  const optionTypeOptions = useMemo(() => [
    { value: 'Castaway', label: 'Castaway' },
    { value: 'Tribe', label: 'Tribe' },
    { value: 'Custom', label: 'Custom' },
  ], []);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = useCallback(() => {
    void (async () => {
      if (!seasonId || !selectedEpisodeId) return;
      setIsSubmitting(true);

      try {
        const data = form.getValues();
        const res = await postData('/api/live', {
          body: {
            seasonId,
            episodeId: data.episodeId,
            title: data.title,
            description: data.description || null,
            options: data.options,
          },
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create');
        }

        await queryClient.invalidateQueries({ queryKey: ['livePredictions'] });

        Alert.alert(
          'Prediction Sent!',
          'Notification sent to live users. Create another?',
          [
            {
              text: 'Yes',
              onPress: () => {
                form.reset({
                  episodeId: data.episodeId,
                  title: '',
                  description: '',
                  optionType: 'Castaway',
                  options: castawayOptions,
                });
              },
            },
            { text: 'Done', style: 'cancel' },
          ]
        );
      } catch (e) {
        console.error('Failed to create live prediction:', e);
        Alert.alert('Error', e instanceof Error ? e.message : 'Something went wrong');
      } finally {
        setIsSubmitting(false);
      }
    })();
  }, [form, seasonId, selectedEpisodeId, postData, queryClient, castawayOptions]);

  const canSubmit = !!title && title.length > 0 && options.length >= 2 && !isSubmitting;

  return {
    form,
    seasonId,
    episodes,
    episodeOptions,
    optionTypeOptions,
    optionType,
    options,
    selectedEpisode,
    templates: LIVE_PREDICTION_TEMPLATES,
    applyTemplate,
    setOptionType,
    addCustomOption,
    removeCustomOption,
    updateCustomOption,
    handleCreate,
    isSubmitting,
    canSubmit,
  };
}
