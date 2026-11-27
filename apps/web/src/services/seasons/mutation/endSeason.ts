import 'server-only';

import { and, eq, inArray, lte, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { leagueSchema } from '~/server/db/schema/leagues';
import { type LeagueStatus } from '~/types/leagues';

// Scheduled jobs can land a little early
const EARLY_TOLERANCE_MS = 5 * 60 * 1000;

/** Episode filter for a finale that has finished airing */
function finaleFinished() {
  const cutoff = new Date(Date.now() + EARLY_TOLERANCE_MS).toISOString();
  return and(
    eq(episodeSchema.isFinale, true),
    lte(sql`${episodeSchema.airDate} + ${episodeSchema.runtime} * interval '1 minute'`, cutoff));
}

/**
  * Whether the league's season finale has finished airing.
  * Only for queries that join other tables, so the league column stays qualified.
  */
export const leagueSeasonOver = () => sql<boolean>`EXISTS (
  SELECT 1 FROM ${episodeSchema}
  WHERE ${episodeSchema.seasonId} = ${leagueSchema.seasonId} AND ${finaleFinished()})`;

/**
  * Catch a league up when its season ended before the end-of-season job reached it,
  * so a visit lands on the finished league instead of a stale predraft or draft
  * @param league The league's season, status and whether its season is over (see leagueSeasonOver)
  * @returns the status and never drafted flag to show
  */
export async function syncLeagueEnd(league: {
  seasonId: number;
  status: LeagueStatus;
  neverDrafted: boolean;
  seasonOver: boolean;
}) {
  if (league.status === 'Inactive' || !league.seasonOver) {
    return { status: league.status, neverDrafted: league.neverDrafted };
  }
  // End the whole season, the same as the scheduled job would
  await endFinishedSeasons(league.seasonId);
  return {
    status: 'Inactive' as const,
    neverDrafted: league.neverDrafted || league.status !== 'Active',
  };
}

/**
  * End the leagues of every season whose finale has finished airing.
  * Active leagues become Inactive. Leagues still in predraft or draft become
  * Inactive too, marked as never drafted so they can be cloned or deleted.
  * Safe to run any time; seasons still airing are left alone.
  * @param seasonId Only check this season
  * @returns how many leagues ended and how many of those never drafted
  * @returnObj `{ seasonIds, ended, neverDrafted }`
  */
export default async function endFinishedSeasons(seasonId?: number) {
  const seasonIds = await db
    .selectDistinct({ seasonId: episodeSchema.seasonId })
    .from(episodeSchema)
    .where(and(
      finaleFinished(),
      seasonId === undefined ? undefined : eq(episodeSchema.seasonId, seasonId)))
    .then((rows) => rows.map((row) => row.seasonId));

  if (seasonIds.length === 0) return { seasonIds, ended: 0, neverDrafted: 0 };

  return db.transaction(async (trx) => {
    const neverDrafted = await trx
      .update(leagueSchema)
      .set({ status: 'Inactive', neverDrafted: true })
      .where(and(
        inArray(leagueSchema.seasonId, seasonIds),
        inArray(leagueSchema.status, ['Predraft', 'Draft'])))
      .returning({ leagueId: leagueSchema.leagueId });

    const ended = await trx
      .update(leagueSchema)
      .set({ status: 'Inactive' })
      .where(and(
        inArray(leagueSchema.seasonId, seasonIds),
        eq(leagueSchema.status, 'Active')))
      .returning({ leagueId: leagueSchema.leagueId });

    const total = ended.length + neverDrafted.length;
    if (total > 0) {
      console.log(`Ended ${total} leagues (${neverDrafted.length} never drafted) for seasons ${seasonIds.join(', ')}`);
    }
    return { seasonIds, ended: total, neverDrafted: neverDrafted.length };
  });
}
