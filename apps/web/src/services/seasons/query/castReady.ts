import 'server-only';

import { eq, min } from 'drizzle-orm';
import { db } from '~/server/db';
import { castawaySchema } from '~/server/db/schema/castaways';

/**
  * When the first castaway was added to a season, which is when the season's
  * leagues can schedule or start their drafts
  * @param seasonId The season
  * @returns when the cast was first added, or null if there is no cast yet
  */
export async function castAddedAt(seasonId: number) {
  return db
    .select({ addedAt: min(castawaySchema.created_at) })
    .from(castawaySchema)
    .where(eq(castawaySchema.seasonId, seasonId))
    .then((rows) => rows[0]?.addedAt ?? null);
}

/**
  * Whether a season has its cast yet
  * @param seasonId The season
  */
export async function seasonCastReady(seasonId: number) {
  return (await castAddedAt(seasonId)) !== null;
}
