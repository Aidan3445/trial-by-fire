import 'server-only';

import { db } from '~/server/db';
import { eq, sql } from 'drizzle-orm';
import { castawaySchema } from '~/server/db/schema/castaways';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type VerifiedLeagueMemberAuth } from '~/types/api';
import { type League } from '~/types/leagues';
import { leagueSeasonOver, syncLeagueEnd } from '~/services/seasons/mutation/endSeason';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { canRequestClone, getPriorSeasonId } from '~/services/leagues/query/cloneRequest';

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
      cloneRequestedAt: leagueMemberSchema.cloneRequestedAt,
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
    .leftJoin(leagueMemberSchema, eq(leagueMemberSchema.memberId, auth.memberId))
    .where(eq(leagueSchema.leagueId, auth.leagueId))
    .then((leagues) => leagues[0]);

  // A league whose season just ended loads as finished right away
  const synced = row && {
    ...row.league,
    ...await syncLeagueEnd({ ...row.league, seasonOver: row.seasonOver }),
  };
  // Only finished leagues can be asked to clone, so skip the season lookup otherwise
  const league: League | undefined = synced && {
    ...synced,
    canRequestClone: synced.status === 'Inactive' && canRequestClone(
      synced,
      { role: auth.role, cloneRequestedAt: row.cloneRequestedAt },
      await getPriorSeasonId()),
  };

  // Dev harness: NODE_ENV is inlined at build time, so this branch and its import are stripped from prod
  if (process.env.NODE_ENV === 'development' && league) {
    const { devHarness } = await import('~/server/devHarness');
    return devHarness.league(league);
  }
  return league;
}
