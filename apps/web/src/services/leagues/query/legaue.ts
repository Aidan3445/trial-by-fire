import 'server-only';

import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type VerifiedLeagueMemberAuth } from '~/types/api';
import { type League } from '~/types/leagues';

/**
   * Get a league by its hash
   * @param auth The authenticated league member
   * @returns the league
   * @throws an error if the user is not authenticated
   * @returnObj `League | undefined`
   */
export default async function getLeague(auth: VerifiedLeagueMemberAuth) {
  const league: League | undefined = await db
    .select({
      leagueId: leagueSchema.leagueId,
      hash: leagueSchema.hash,
      name: leagueSchema.name,
      status: leagueSchema.status,
      season: seasonSchema.name,
      seasonId: seasonSchema.seasonId,
      startWeek: leagueSchema.startWeek,
    })
    .from(leagueSchema)
    .innerJoin(seasonSchema, eq(leagueSchema.seasonId, seasonSchema.seasonId))
    .where(eq(leagueSchema.leagueId, auth.leagueId))
    .then((leagues) => leagues[0]);

  // Dev harness: NODE_ENV is inlined at build time, so this branch and its import are stripped from prod
  if (process.env.NODE_ENV === 'development' && league) {
    const { devHarness } = await import('~/server/devHarness');
    return devHarness.league(league);
  }
  return league;
}
