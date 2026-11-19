import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import { customEventsOpen } from '~/lib/leagues';
import { parseSeasonDate, seasonFinale } from '~/services/seasons/query/seasonDates';
import { type VerifiedLeagueMemberAuth } from '~/types/api';

/**
  * Throw unless the league can still log custom events: any league that hasn't
  * ended, or one that ended with the finale less than a week ago
  * @param auth The authenticated league member
  * @throws if custom events are closed for the league
  */
export async function assertCustomEventsOpen(auth: VerifiedLeagueMemberAuth) {
  if (auth.status !== 'Inactive') return;
  const league = await db
    .select({ neverDrafted: leagueSchema.neverDrafted, finaleDate: seasonFinale })
    .from(leagueSchema)
    .innerJoin(seasonSchema, eq(seasonSchema.seasonId, leagueSchema.seasonId))
    .where(eq(leagueSchema.leagueId, auth.leagueId))
    .then((rows) => rows[0]);
  const finaleDate = league?.finaleDate ? parseSeasonDate(league.finaleDate) : null;
  if (!league || !customEventsOpen(auth.status, finaleDate, league.neverDrafted)) {
    throw new Error('League is inactive');
  }
}
