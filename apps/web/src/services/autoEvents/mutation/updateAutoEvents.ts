import 'server-only';

import { and, eq, inArray, isNull } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { autoEventSchema } from '~/server/db/schema/autoEvents';
import { autoEventKept } from '~/lib/events';
import { type BaseEventInsert } from '~/types/events';
import { type DBTransaction } from '~/types/server';

export const AutoEventActions = ['view', 'deny', 'restore'] as const;
export type AutoEventAction = (typeof AutoEventActions)[number];

/**
  * Mark auto events viewed, deny them, or put denied ones back in the queue
  * @param seasonId The season the auto events belong to
  * @param autoEventIds The auto events to update
  * @param action What to do
  * @param userId The admin doing it
  * @returns the number of auto events changed
  */
export default async function updateAutoEventsLogic(
  seasonId: number,
  autoEventIds: number[],
  action: AutoEventAction,
  userId: string
) {
  if (autoEventIds.length === 0) return 0;

  const inSeason = inArray(autoEventSchema.episodeId, db
    .select({ episodeId: episodeSchema.episodeId })
    .from(episodeSchema)
    .where(eq(episodeSchema.seasonId, seasonId)));
  const now = new Date();

  const changed = await db
    .update(autoEventSchema)
    .set(action === 'view'
      ? { viewedAt: now }
      : action === 'deny'
        ? { status: 'denied', handledBy: userId, handledAt: now, viewedAt: now }
        : { status: 'pending', handledBy: null, handledAt: null })
    .where(and(
      inArray(autoEventSchema.autoEventId, autoEventIds),
      inSeason,
      action === 'view' ? isNull(autoEventSchema.viewedAt)
        : action === 'deny' ? eq(autoEventSchema.status, 'pending')
          : eq(autoEventSchema.status, 'denied')))
    .returning({ autoEventId: autoEventSchema.autoEventId });

  if (changed.length) revalidateTag(`auto-events-${seasonId}`, { expire: 0 });
  return changed.length;
}

/**
  * Close an auto event the admin turned into a base event. It counts as used when
  * the event kept any of the auto event's data, and links to the event if so.
  * @param trx The transaction creating the event
  * @param autoEventId The auto event the form was filled from
  * @param event The event as submitted
  * @param baseEventId The new event
  * @param userId The admin who created it
  * @returns the auto event's episode, to revalidate after the transaction
  */
export async function acceptAutoEvent(
  trx: DBTransaction,
  autoEventId: number,
  event: BaseEventInsert,
  baseEventId: number,
  userId: string | null
) {
  const autoEvent = await trx
    .select({
      episodeId: autoEventSchema.episodeId,
      eventName: autoEventSchema.eventName,
      subtype: autoEventSchema.subtype,
      references: autoEventSchema.references,
    })
    .from(autoEventSchema)
    .where(eq(autoEventSchema.autoEventId, autoEventId))
    .then((rows) => rows[0]);
  if (!autoEvent) return null;

  const used = autoEventKept(autoEvent, { eventName: event.eventName, label: event.label ?? null, references: event.references });
  const now = new Date();
  await trx
    .update(autoEventSchema)
    .set({
      status: 'accepted',
      used,
      baseEventId: used ? baseEventId : null,
      handledBy: userId,
      handledAt: now,
      viewedAt: now,
    })
    .where(eq(autoEventSchema.autoEventId, autoEventId));
  return autoEvent.episodeId;
}
