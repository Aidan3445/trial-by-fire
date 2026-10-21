import 'server-only';
import { revalidateTag } from 'next/cache';
import { EliminationEventNames } from '~/lib/events';
import { db } from '~/server/db';
import { baseEventReferenceSchema, baseEventSchema } from '~/server/db/schema/baseEvents';
import { type BaseEventInsert, tribeUpdateProblem } from '~/types/events';
import { createEventTribe } from '~/services/seasons/mutation/eventTribe';
import { sendBaseEventNotification } from '~/services/notifications/events/baseEvents';
import { acceptAutoEvent } from '~/services/autoEvents/mutation/updateAutoEvents';
import { revalidateAutoEvents } from '~/services/autoEvents/query/autoEvents';

/**
  * Create a new base event for the season
  * @param baseEvent event to create, with a new tribe to create and reference if it names one
  * @param fromAutoEvent the detected auto event the event was filled from, if any
  * @throws if the event cannot be created
  * @throws if a tribe update does not have exactly one tribe
  * @throws if the new tribe's name is already taken this season
  * @returns the id of the created base event
  * @returnObj `{ newEventId }`
  */
export default async function createBaseEventLogic(
  { newTribe, ...event }: BaseEventInsert,
  fromAutoEvent?: { autoEventId: number; userId: string | null }
) {
  const problem = tribeUpdateProblem({ ...event, newTribe });
  if (problem) throw new Error(problem);

  // create transaction for the event and reference insertions
  const result = await db.transaction(async (trx) => {
    // insert the base event
    const newEventId = await trx
      .insert(baseEventSchema)
      .values({
        episodeId: event.episodeId,
        eventName: event.eventName,
        label: event.label,
        notes: event.notes?.map(note => note.trim()).filter(note => note.length > 0),
      })
      .returning({ baseEventId: baseEventSchema.baseEventId })
      .then((result) => result[0]?.baseEventId);

    if (!newEventId) throw new Error('Failed to create base event');

    const baseEvent = newTribe
      ? {
        ...event,
        references: [...event.references, {
          type: 'Tribe' as const,
          id: await createEventTribe(trx, event.episodeId, newEventId, newTribe),
        }],
      }
      : event;

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
      revalidateTag('tribe-members', { expire: 0 });
      revalidateTag('eliminations', { expire: 0 });
    }

    revalidateTag('base-events', { expire: 0 });

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
      baseEvent,
    };
  });

  if (result.autoEventEpisodeId) await revalidateAutoEvents(result.autoEventEpisodeId);

  // Send live scoring notification outside transaction
  void sendBaseEventNotification(result.baseEvent);

  return { newEventId: result.newEventId };
}
