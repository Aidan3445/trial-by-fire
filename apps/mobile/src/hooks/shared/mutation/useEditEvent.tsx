import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useEventOptions } from '~/hooks/seasons/enrich/useEventOptions';
import { useFetch } from '~/hooks/helpers/useFetch';
import {
  BaseEventInsertZod,
  CustomEventInsertZod,
  type BaseEventInsert,
  type CustomEventInsert,
  type EnrichedEvent,
  type BaseEventName,
} from '~/types/events';
import { Alert } from 'react-native';

export function useEditEvent(event: EnrichedEvent, seasonIdOverride?: number) {
  const queryClient = useQueryClient();
  const { data: league } = useLeague();
  const seasonId = seasonIdOverride ?? league?.seasonId;

  const putEvent = useFetch('PUT');
  const deleteEvent = useFetch('DELETE');

  const isBaseEvent = event.eventSource === 'Base';

  const form = useForm<BaseEventInsert | CustomEventInsert>({
    defaultValues: {
      label: event.label ?? '',
      notes: event.notes ?? [],
      references: event.references,
      customEventRuleId: event.customEventRuleId,
      episodeId: event.episodeId,
      eventName: event.eventName as BaseEventName,
    },
    resolver: zodResolver(z.union([BaseEventInsertZod, CustomEventInsertZod])),
  });

  const {
    combinedReferenceOptions,
    handleCombinedReferenceSelection,
    getDefaultStringValues,
  } = useEventOptions(seasonId ?? null, event.episodeNumber);

  // Clear key for resetting MultiSelect
  const [clearKey, setClearKey] = useState(0);

  const clearReferences = useCallback(() => {
    setClearKey((k) => k + 1);
    form.resetField('references');
  }, [form]);

  // Submission states
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const invalidateQueries = useCallback(async () => {
    if (isBaseEvent) {
      await queryClient.invalidateQueries({ queryKey: ['baseEvents', seasonId] });
      await queryClient.invalidateQueries({ queryKey: ['seasons'] });
    } else {
      await queryClient.invalidateQueries({ queryKey: ['customEvents', league?.hash] });
    }
  }, [isBaseEvent, seasonId, league?.hash, queryClient]);

  const handleUpdate = form.handleSubmit(async (data) => {
    setIsUpdating(true);
    try {
      let response;

      if (isBaseEvent) {
        response = await putEvent('/api/seasons/baseEvents', {
          body: { baseEventId: event.eventId, baseEvent: data },
        });
      } else {
        if (!event.customEventRuleId) throw new Error('Missing customEventRuleId');
        if (!league?.hash) throw new Error('Missing league hash');

        response = await putEvent(`/api/leagues/${league.hash}/customEvents`, {
          body: { eventId: event.eventId, event: data },
        });
      }

      if (!response.ok) {
        throw new Error('Failed to update event');
      }

      clearReferences();
      await invalidateQueries();
      Alert.alert('Success', 'Event updated');
      return { success: true };
    } catch (e) {
      console.error('Failed to update event', e);
      Alert.alert('Error', 'Failed to update event');
      return { success: false, error: e };
    } finally {
      setIsUpdating(false);
    }
  });

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      let response;

      if (isBaseEvent) {
        response = await deleteEvent('/api/seasons/baseEvents', {
          body: { eventId: event.eventId },
        });
      } else {
        if (!event.customEventRuleId) throw new Error('Missing customEventRuleId');
        if (!league?.hash) throw new Error('Missing league hash');

        response = await deleteEvent(`/api/leagues/${league.hash}/customEvents`, {
          body: { eventId: event.eventId },
        });
      }

      if (!response.ok) {
        throw new Error('Failed to delete event');
      }

      clearReferences();
      await invalidateQueries();
      return { success: true };
    } catch (e) {
      console.error('Failed to delete event', e);
      return { success: false, error: e };
    } finally {
      setIsDeleting(false);
    }
  };

  return {
    // Event info
    event,
    isBaseEvent,

    // Form
    form,
    clearKey,
    clearReferences,

    // Options
    combinedReferenceOptions,
    handleCombinedReferenceSelection,
    getDefaultStringValues,

    // Actions
    handleUpdate,
    handleDelete,
    isUpdating,
    isDeleting,
  };
}
