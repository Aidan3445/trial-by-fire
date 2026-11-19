import 'server-only';

import { db } from '~/server/db';
import { eq, sql } from 'drizzle-orm';
import { castawaySchema } from '~/server/db/schema/castaways';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type VerifiedLeagueMemberAuth } from '~/types/api';
import { type League } from '~/types/leagues';
import { leagueSeasonOver, syncLeagueEnd } from '~/services/seasons/mutation/endSeason';

/**
   * Get a league by its hash
   * @param auth The authenticated league member
   * @returns the league
   * @throws an error if the user is not authenticated
   * @returnObj `League | undefined`
   */
export default async function getLeague(auth: VerifiedLeagueMemberAuth) {
  const row = await db
    .select({
      seasonOver: leagueSeasonOver(),
      league: {
        leagueId: leagueSchema.leagueId,
        hash: leagueSchema.hash,
        name: leagueSchema.name,
        status: leagueSchema.status,
        season: seasonSchema.name,
        seasonId: seasonSchema.seasonId,
        startWeek: leagueSchema.startWeek,
        neverDrafted: leagueSchema.neverDrafted,
        castReady: sql<boolean>`EXISTS (
          SELECT 1 FROM ${castawaySchema} WHERE ${castawaySchema.seasonId} = ${leagueSchema.seasonId})`,
      },
    })
    .from(leagueSchema)
    .innerJoin(seasonSchema, eq(leagueSchema.seasonId, seasonSchema.seasonId))
    .where(eq(leagueSchema.leagueId, auth.leagueId))
    .then((leagues) => leagues[0]);

  // A league whose season just ended loads as finished right away
  const league: League | undefined = row && {
    ...row.league,
    ...await syncLeagueEnd({ ...row.league, seasonOver: row.seasonOver }),
  };

  // Dev harness: NODE_ENV is inlined at build time, so this branch and its import are stripped from prod
  if (process.env.NODE_ENV === 'development' && league) {
    const { devHarness } = await import('~/server/devHarness');
    return devHarness.league(league);
  }
  return league;
}
