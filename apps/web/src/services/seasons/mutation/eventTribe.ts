import 'server-only';

import { and, eq, ne, sql } from 'drizzle-orm';
import { revalidateTag } from 'next/cache';
import { type DBTransaction } from '~/types/server';
import { episodeSchema } from '~/server/db/schema/episodes';
import { tribeSchema } from '~/server/db/schema/tribes';
import { type TribeInsert } from '~/types/tribes';

/**
  * Tribes made or renamed from a tribe update event, inside that event's transaction
  */

/**
  * Get the season an episode belongs to
  * @throws if the episode does not exist
  */
async function seasonOfEpisode(trx: DBTransaction, episodeId: number) {
  const season = await trx
    .select({ seasonId: episodeSchema.seasonId })
    .from(episodeSchema)
    .where(eq(episodeSchema.episodeId, episodeId))
    .then((res) => res[0]);
  if (!season) throw new Error('Episode not found');
  return season.seasonId;
}

/**
  * Make sure no other tribe in the season goes by this name, ignoring case
  * @throws if the name is taken
  */
async function assertNameFree(trx: DBTransaction, seasonId: number, tribeName: string, exceptTribeId?: number) {
  const taken = await trx
    .select({ tribeId: tribeSchema.tribeId })
    .from(tribeSchema)
    .where(and(
      eq(tribeSchema.seasonId, seasonId),
      sql`lower(${tribeSchema.tribeName}) = lower(${tribeName})`,
      exceptTribeId === undefined ? undefined : ne(tribeSchema.tribeId, exceptTribeId)))
    .then((res) => res.length > 0);
  if (taken) throw new Error(`Tribe ${tribeName} already exists`);
}

const revalidateTribes = (seasonId: number) => {
  revalidateTag(`tribes-${seasonId}`, { expire: 0 });
  revalidateTag('seasons', { expire: 0 });
};

/**
  * Create the tribe a tribe update event moves castaways onto
  * @param trx the event's transaction
  * @param episodeId the event's episode
  * @param baseEventId the event creating the tribe
  * @param tribe the new tribe's name and color
  * @throws if the name is taken this season
  * @returns the new tribe's id
  */
export async function createEventTribe(trx: DBTransaction, episodeId: number, baseEventId: number, tribe: TribeInsert) {
  const seasonId = await seasonOfEpisode(trx, episodeId);
  await assertNameFree(trx, seasonId, tribe.tribeName);
  const tribeId = await trx
    .insert(tribeSchema)
    .values({ ...tribe, seasonId, createdByEventId: baseEventId })
    .returning({ tribeId: tribeSchema.tribeId })
    .then((res) => res[0]?.tribeId);
  if (!tribeId) throw new Error('Failed to create tribe');
  revalidateTribes(seasonId);
  return tribeId;
}

/**
  * Rename and recolor the tribe a tribe update event created
  * @param trx the event's transaction
  * @param baseEventId the event that created the tribe
  * @param tribeId the event's one tribe
  * @param tribe the new name and color
  * @throws if the tribe was not created by this event
  * @throws if the name is taken by another tribe this season
  */
export async function editEventTribe(trx: DBTransaction, baseEventId: number, tribeId: number, tribe: TribeInsert) {
  const existing = await trx
    .select({ seasonId: tribeSchema.seasonId, createdByEventId: tribeSchema.createdByEventId })
    .from(tribeSchema)
    .where(eq(tribeSchema.tribeId, tribeId))
    .then((res) => res[0]);
  if (existing?.createdByEventId !== baseEventId || existing.seasonId === null) {
    throw new Error('Only the tribe this event created can be edited from it');
  }
  await assertNameFree(trx, existing.seasonId, tribe.tribeName, tribeId);
  await trx
    .update(tribeSchema)
    .set({ tribeName: tribe.tribeName, tribeColor: tribe.tribeColor })
    .where(eq(tribeSchema.tribeId, tribeId));
  revalidateTribes(existing.seasonId);
}
