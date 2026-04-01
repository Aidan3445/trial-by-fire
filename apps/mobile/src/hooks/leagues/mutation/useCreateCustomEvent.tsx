import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { useLeagueData } from '~/hooks/leagues/enrich/useLeagueData';
import { useLeagueRules } from '~/hooks/leagues/query/useLeagueRules';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { useEventOptions } from '~/hooks/seasons/enrich/useEventOptions';
import { useFetch } from '~/hooks/helpers/useFetch';
import {
  CustomEventInsertZod,
  type CustomEventInsert,
  type EventWithReferences,
} from '~/types/events';
import { useRouter } from 'expo-router';
import { Alert, Text, View } from 'react-native';
import AirStatus from '~/components/shared/episodes/airStatus';

export function useCreateCustomEvent() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const leagueData = useLeagueData();
  const { data: rules } = useLeagueRules();
  const { data: episodes } = useEpisodes(leagueData?.league?.seasonId ?? null);
  const { data: seasonData } = useSeasonsData(true, leagueData?.league?.seasonId ?? undefined);
  const season = seasonData?.[0];

  const postEvent = useFetch('POST');

  // Form setup
  const form = useForm<CustomEventInsert>({
    defaultValues: {
      episodeId: episodes?.find((ep) => ep.airStatus === 'Airing')?.episodeId ??
        episodes?.findLast((ep) => ep.airStatus === 'Aired')?.episodeId ??
        episodes?.[0]?.episodeId,
      notes: null,
    },
    resolver: zodResolver(CustomEventInsertZod),
  });


  // Watched values
  const selectedRuleId = form.watch('customEventRuleId');
  const selectedReferences = form.watch('references');
  const selectedEpisodeId = form.watch('episodeId');
  const setLabel = form.watch('label');
  const setNotes = form.watch('notes');

  // Derived state
  const selectedEvent = useMemo(() =>
    rules?.custom.find((rule) => rule.customEventRuleId === selectedRuleId),
    [rules?.custom, selectedRuleId]
  );

  const selectedEpisode = useMemo(() =>
    episodes?.find((ep) => ep.episodeId === selectedEpisodeId)?.episodeNumber,
    [episodes, selectedEpisodeId]
  );

  // Reference options for the selected episode
  const { combinedReferenceOptions, handleCombinedReferenceSelection } = useEventOptions(
    leagueData?.league?.seasonId ?? null,
    selectedEpisode ?? 1
  );

  // Clear key for resetting MultiSelect
  const [clearKey, setClearKey] = useState(0);

  const clearReferences = useCallback(() => {
    setClearKey((k) => k + 1);
    form.resetField('references');
  }, [form]);

  // Mock event for preview
  const mockEvent = useMemo<EventWithReferences | null>(() => {
    if (!selectedEvent) return null;
    return {
      eventSource: 'Custom',
      eventType: 'Direct',
      eventName: selectedEvent.eventName,
      label: setLabel ?? selectedEvent.eventName,
      episodeNumber: selectedEpisode,
      references: selectedReferences ?? [],
      notes: setNotes,
    } as EventWithReferences;
  }, [selectedEpisode, selectedEvent, selectedReferences, setLabel, setNotes]);

  // Select options
  const episodeOptions = useMemo(
    () =>
      episodes?.map((episode) => ({
        value: episode.episodeId,
        label: `EP ${episode.episodeNumber}: ${episode.title}`,
        renderLabel: () => (
          <View className='flex-1' >
            <Text className='text-foreground'>
              <Text className='font-bold'> EP {episode.episodeNumber}: </Text>
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

  const eventOptions = useMemo(() =>
    rules?.custom.map((rule) => ({
      label: `${rule.eventName} (${rule.eventType})`,
      value: rule.customEventRuleId,
    })) ?? [],
    [rules?.custom]
  );

  // Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreate = form.handleSubmit(async (data) => {
    const hash = leagueData?.league?.hash;
    if (!hash) return { success: false, error: 'No league found' };

    setIsSubmitting(true);
    try {
      const response = await postEvent(`/api/leagues/${hash}/customEvents`, {
        body: { event: data },
      });

      if (!response.ok) {
        throw new Error(response.status === 401 || response.status === 403
          ? 'Unauthorized'
          : 'Failed to create event');
      }

      await queryClient.invalidateQueries({ queryKey: ['customEvents', hash] });

      // Alert user of success and ask if there is another event to score
      Alert.alert(
        'Success',
        'Custom event created successfully! Do you want to create another?',
        [
          {
            text: 'Yes',
            onPress: () => {
              clearReferences();
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
      console.error('Failed to create custom event', e);
      return { success: false, error: e };
    } finally {
      setIsSubmitting(false);
    }
  });

  // Validation state
  const canSubmit =
    !!selectedEvent &&
    !!selectedReferences &&
    selectedReferences.length > 0 &&
    !isSubmitting;

  return {
    // Data
    leagueData,
    season,
    rules,
    episodes,

    // Form
    form,
    clearKey,
    clearReferences,

    // Selections
    selectedEvent,
    selectedEpisode,
    selectedReferences,

    // Options
    episodeOptions,
    eventOptions,
    combinedReferenceOptions,
    handleCombinedReferenceSelection,

    // Preview
    mockEvent,

    // Actions
    handleCreate,
    isSubmitting,
    canSubmit,

    // State checks
    hasCustomRules: !!rules?.custom && rules.custom.length > 0,
  };
}
