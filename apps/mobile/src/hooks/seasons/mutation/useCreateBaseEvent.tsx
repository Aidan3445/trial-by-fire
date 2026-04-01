import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { useEventOptions } from '~/hooks/seasons/enrich/useEventOptions';
import { useFetch } from '~/hooks/helpers/useFetch';
import {
  BaseEventInsertZod,
  type BaseEventInsert,
  type BaseEventName,
  type EventWithReferences,
} from '~/types/events';
import { BaseEventNames, BaseEventLabels, BaseEventLabelPrefixes } from '~/lib/events';
import AirStatus from '~/components/shared/episodes/airStatus';

export function useCreateBaseEvent(seasonId: number | null) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { data: episodes } = useEpisodes(seasonId);
  const { data: seasonData } = useSeasonsData(true, seasonId ?? undefined);
  const season = seasonData?.[0];

  const postEvent = useFetch('POST');

  // Form setup
  const form = useForm<BaseEventInsert>({
    defaultValues: {
      episodeId:
        episodes?.find((ep) => ep.airStatus === 'Airing')?.episodeId ??
        episodes?.findLast((ep) => ep.airStatus === 'Aired')?.episodeId ??
        episodes?.[0]?.episodeId,
      notes: null,
    },
    resolver: zodResolver(BaseEventInsertZod),
  });

  // Watched values
  const selectedEventName = form.watch('eventName');
  const selectedReferences = form.watch('references');
  const selectedEpisodeId = form.watch('episodeId');
  const setLabel = form.watch('label');
  const setNotes = form.watch('notes');

  // Event subtype (not part of form, just for label helper)
  const [eventSubtype, setEventSubtype] = useState('');

  const selectedEpisode = useMemo(() =>
    episodes?.find((ep) => ep.episodeId === selectedEpisodeId)?.episodeNumber,
    [episodes, selectedEpisodeId]
  );

  // Reference options for the selected episode
  const { combinedReferenceOptions, handleCombinedReferenceSelection } = useEventOptions(
    seasonId,
    selectedEpisode ?? 1
  );

  // Clear key for resetting MultiSelect
  const [clearKey, setClearKey] = useState(0);

  const clearReferences = useCallback(() => {
    setClearKey((k) => k + 1);
    form.resetField('references');
  }, [form]);

  // Label helper - auto-populates label based on subtype selection
  const handleSubtypeChange = useCallback((subtype: string) => {
    setEventSubtype(subtype);
    if (subtype === 'Custom') {
      form.setValue('label', '');
    } else {
      form.setValue('label', `${BaseEventLabelPrefixes[selectedEventName]} ${subtype}`);
    }
  },
    [form, selectedEventName]
  );

  // Reset subtype when event changes
  const handleEventChange = useCallback((eventName: BaseEventName) => {
    form.setValue('eventName', eventName);
    form.resetField('label');
    setEventSubtype('');
    clearReferences();
  },
    [form, clearReferences]
  );

  // Mock event for preview
  const mockEvent = useMemo<EventWithReferences | null>(() => {
    if (!selectedEventName) return null;
    return {
      eventSource: 'Base',
      eventType: 'Direct',
      eventName: selectedEventName,
      label:
        setLabel ??
        `${BaseEventLabelPrefixes[selectedEventName]} ${BaseEventLabels[selectedEventName]?.[0] ?? selectedEventName}`,
      episodeNumber: selectedEpisode,
      references: selectedReferences ?? [],
      notes: setNotes,
    } as EventWithReferences;
  }, [selectedEpisode, selectedEventName, selectedReferences, setLabel, setNotes]);

  // Select options
  const episodeOptions = useMemo(() =>
    episodes?.map((episode) => ({
      value: episode.episodeId,
      label: `EP ${episode.episodeNumber}: ${episode.title}`,
      renderLabel: () => (
        <View className='flex-1'>
          <Text className='text-foreground'>
            <Text className='font-bold'>EP {episode.episodeNumber}: </Text>
            {episode.title}
            {'  '}
            <View style={{ transform: [{ translateY: 2 }] }}>
              <AirStatus
                airDate={episode.airDate}
                airStatus={episode.airStatus}
                showTime={false}
                showDate={false} />
            </View>
          </Text>
        </View>
      ),
    })) ?? [],
    [episodes]
  );

  const eventNameOptions = useMemo(() =>
    BaseEventNames.map((eventName) => ({
      label: eventName,
      value: eventName,
    })),
    []
  );

  const subtypeOptions = useMemo(() => {
    if (!selectedEventName) return [];
    const subtypes = BaseEventLabels[selectedEventName] ?? [];
    return [
      ...subtypes.map((subtype) => ({
        label: subtype,
        value: subtype,
      })),
      { label: 'Custom', value: 'Custom' },
    ];
  }, [selectedEventName]);

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = form.handleSubmit(async (data) => {
    if (!seasonId) return { success: false, error: 'No season found' };

    setIsSubmitting(true);

    try {
      const response = await postEvent('/api/seasons/baseEvents', {
        body: { event: data },
      });

      if (!response.ok) {
        throw new Error(
          response.status === 401 || response.status === 403
            ? 'Unauthorized'
            : 'Failed to create event'
        );
      }

      await queryClient.invalidateQueries({ queryKey: ['baseEvents', seasonId] });
      await queryClient.invalidateQueries({ queryKey: ['seasons', seasonId, true] });

      Alert.alert(
        'Success',
        'Base event created successfully! Do you want to create another?',
        [
          {
            text: 'Yes',
            onPress: () => {
              clearReferences();
              setEventSubtype('');
              form.reset({ episodeId: data.episodeId, notes: null });
            },
          },
          {
            text: 'No',
            onPress: () => {
              router.dismiss();
            },
            style: 'cancel',
          },
        ]
      );

      return { success: true };
    } catch (e) {
      console.error('Failed to create base event', e);
      Alert.alert('Error', 'Failed to create base event');
      return { success: false, error: e };
    } finally {
      setIsSubmitting(false);
    }
  });

  // Validation state
  const canSubmit =
    !!selectedEventName &&
    !!setLabel &&
    setLabel !== '' &&
    !!selectedReferences &&
    selectedReferences.length > 0 &&
    !isSubmitting;

  return {
    // Data
    seasonId,
    season,
    episodes,

    // Form
    form,
    clearKey,
    clearReferences,

    // Selections
    selectedEventName,
    selectedEpisode,
    selectedReferences,
    eventSubtype,

    // Handlers
    handleEventChange,
    handleSubtypeChange,

    // Options
    episodeOptions,
    eventNameOptions,
    subtypeOptions,
    combinedReferenceOptions,
    handleCombinedReferenceSelection,

    // Preview
    mockEvent,

    // Actions
    handleCreate,
    isSubmitting,
    canSubmit,
  };
}
