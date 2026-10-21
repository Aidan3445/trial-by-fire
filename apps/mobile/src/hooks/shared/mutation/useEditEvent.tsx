import { useCallback, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useEventOptions } from '~/hooks/seasons/enrich/useEventOptions';
import { useFetch } from '~/hooks/helpers/useFetch';
import { useTribes } from '~/hooks/seasons/useTribes';
import { editableEventTribe, tribeNameTaken } from '~/lib/events';
import { type TribeInsert } from '~/types/tribes';
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
  } = useEventOptions(
    seasonId ?? null,
    event.episodeNumber,
    event.eventName,
    event.references
  );

  // A tribe update that created its tribe can rename and recolor it, while that is its only tribe
  const { data: tribes } = useTribes(seasonId ?? null);
  const selectedReferences = form.watch('references');
  const createdTribe = editableEventTribe(event, selectedReferences ?? [], tribes ?? []);
  const [tribeEdit, setTribeEdit] = useState<TribeInsert | null>(null);
  const tribeFields = tribeEdit ?? (createdTribe && { tribeName: createdTribe.tribeName, tribeColor: createdTribe.tribeColor });
  const otherTribeNames = useMemo(() => (tribes ?? [])
    .filter((tribe) => tribe.tribeId !== createdTribe?.tribeId)
    .map((tribe) => tribe.tribeName), [tribes, createdTribe?.tribeId]);
  const tribeEditInvalid = !!createdTribe && !!tribeEdit &&
    (tribeEdit.tribeName.trim() === '' || tribeNameTaken(tribeEdit.tribeName, otherTribeNames));

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

      const edit = isBaseEvent && createdTribe && tribeEdit
        ? { ...tribeEdit, tribeName: tribeEdit.tribeName.trim() }
        : null;
      if (isBaseEvent) {
        response = await putEvent('/api/seasons/baseEvents', {
          body: { baseEventId: event.eventId, baseEvent: { ...data, tribeEdit: edit } },
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
      if (edit) await queryClient.invalidateQueries({ queryKey: ['tribes', seasonId] });
      setTribeEdit(null);
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

    // Tribe this event created
    createdTribe,
    tribeFields,
    setTribeEdit,
    otherTribeNames,
    tribeEditInvalid,

    // Actions
    handleUpdate,
    handleDelete,
    isUpdating,
    isDeleting,
  };
}
