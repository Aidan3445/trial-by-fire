import 'server-only';
import { revalidateTag } from 'next/cache';
import { EliminationEventNames } from '~/lib/events';
import { db } from '~/server/db';
import { baseEventReferenceSchema, baseEventSchema } from '~/server/db/schema/baseEvents';
import { type BaseEventInsert } from '~/types/events';
import { sendBaseEventNotification } from '~/services/notifications/events/baseEvents';
import { acceptAutoEvent } from '~/services/autoEvents/mutation/updateAutoEvents';
import { revalidateAutoEvents } from '~/services/autoEvents/query/autoEvents';

/**
  * Create a new base event for the season
  * @param baseEvent event to create
  * @param fromAutoEvent the detected auto event the event was filled from, if any
  * @throws if the event cannot be created
  * @returns the id of the created base event
  * @returnObj `{ newEventId }`
  */
export default async function createBaseEventLogic(
  baseEvent: BaseEventInsert,
  fromAutoEvent?: { autoEventId: number; userId: string | null }
) {
  // create transaction for the event and reference insertions
  const result = await db.transaction(async (trx) => {
    // insert the base event
    const newEventId = await trx
      .insert(baseEventSchema)
      .values({
        episodeId: baseEvent.episodeId,
        eventName: baseEvent.eventName,
        label: baseEvent.label,
        notes: baseEvent.notes?.map(note => note.trim()).filter(note => note.length > 0),
      })
      .returning({ baseEventId: baseEventSchema.baseEventId })
      .then((result) => result[0]?.baseEventId);

    if (!newEventId) throw new Error('Failed to create base event');

    const eventRefs = baseEvent.references.map((reference) => ({
      baseEventId: newEventId,
      referenceType: reference.type,
      referenceId: reference.id,
    }));

    // insert the base event references
    await trx
      .insert(baseEventReferenceSchema)
      .values(eventRefs);

    if ([...EliminationEventNames, 'tribeUpdate'].includes(baseEvent.eventName)) {
      revalidateTag('tribe-members', 'max');
      revalidateTag('eliminations', 'max');
    }

    revalidateTag('base-events', 'max');

    const autoEventEpisodeId = fromAutoEvent
      ? await acceptAutoEvent(trx, fromAutoEvent.autoEventId, baseEvent, newEventId, fromAutoEvent.userId)
      : null;

    return {
      newEventId,
      autoEventEpisodeId,
      episodeId: baseEvent.episodeId,
      eventName: baseEvent.eventName,
      label: baseEvent.label,
      references: baseEvent.references,
    };
  });

  if (result.autoEventEpisodeId) await revalidateAutoEvents(result.autoEventEpisodeId);

  // Send live scoring notification outside transaction
  void sendBaseEventNotification(baseEvent);

  return { newEventId: result.newEventId };
}
