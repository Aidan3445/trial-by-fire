import 'server-only';

import { asc, eq } from 'drizzle-orm';
import { revalidateTag, unstable_cache } from 'next/cache';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { eventCheckSchema, autoEventSchema } from '~/server/db/schema/autoEvents';
import { type AutoEvent } from '~/types/events';

const tag = (seasonId: number) => `auto-events-${seasonId}`;

/**
  * Get every auto event detected for a season, oldest first. Cached until a
  * auto event for the season is added or changes, rather than on a timer.
  * @param seasonId The season to get auto events for
  * @returnObj `AutoEvent[]`
  */
export default async function getAutoEvents(seasonId: number) {
  return unstable_cache(
    async (seasonId: number) => fetchAutoEvents(seasonId),
    ['auto-events', seasonId.toString()],
    {
      revalidate: false,
      tags: [tag(seasonId), 'auto-events']
    }
  )(seasonId);
}

/**
  * Drop the cached auto events for an episode's season so the next read sees changes
  * @param episodeId The episode whose auto events changed
  */
export async function revalidateAutoEvents(episodeId: number) {
  const seasonId = await db
    .select({ seasonId: episodeSchema.seasonId })
    .from(episodeSchema)
    .where(eq(episodeSchema.episodeId, episodeId))
    .then((rows) => rows[0]?.seasonId);
  // Expire now rather than serve stale once: admins are waiting on new auto events
  if (seasonId) revalidateTag(tag(seasonId), { expire: 0 });
}

async function fetchAutoEvents(seasonId: number): Promise<AutoEvent[]> {
  const rows = await db
    .select({
      autoEventId: autoEventSchema.autoEventId,
      checkId: autoEventSchema.checkId,
      seasonId: episodeSchema.seasonId,
      episodeId: autoEventSchema.episodeId,
      episodeNumber: episodeSchema.episodeNumber,
      segment: eventCheckSchema.segment,
      trigger: eventCheckSchema.trigger,
      eventName: autoEventSchema.eventName,
      subtype: autoEventSchema.subtype,
      references: autoEventSchema.references,
      unmatched: autoEventSchema.unmatched,
      notes: autoEventSchema.notes,
      confidence: autoEventSchema.confidence,
      asks: autoEventSchema.asks,
      detections: autoEventSchema.detections,
      status: autoEventSchema.status,
      viewedAt: autoEventSchema.viewedAt,
      used: autoEventSchema.used,
      baseEventId: autoEventSchema.baseEventId,
      createdAt: autoEventSchema.created_at,
    })
    .from(autoEventSchema)
    .innerJoin(episodeSchema, eq(autoEventSchema.episodeId, episodeSchema.episodeId))
    .innerJoin(eventCheckSchema, eq(autoEventSchema.checkId, eventCheckSchema.checkId))
    .where(eq(episodeSchema.seasonId, seasonId))
    .orderBy(asc(autoEventSchema.created_at), asc(autoEventSchema.autoEventId));

  return rows.map(({ viewedAt, ...autoEvent }) => ({ ...autoEvent, viewed: viewedAt !== null }));
}
