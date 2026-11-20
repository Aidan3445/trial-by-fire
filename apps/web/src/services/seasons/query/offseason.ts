import 'server-only';

import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '~/server/db';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import getAllSeasons from '~/services/seasons/query/allSeasons';
import { seasonCastReady } from '~/services/seasons/query/castReady';
import { type OffseasonStatus } from '~/types/survey';

// Give everyone a week with the finished season before saying it's over
const NOTICE_DELAY_MS = 7 * 24 * 60 * 60 * 1000;

/**
  * Where things stand between seasons for a user: the season that most
  * recently ended, the one after it, and how they took part in the one that ended
  * @param userId The user
  * @returnObj `OffseasonStatus`
  */
export default async function getOffseasonStatus(userId: string): Promise<OffseasonStatus> {
  const now = Date.now();
  const seasons = await getAllSeasons();
  const endedIndex = seasons.findIndex((season) =>
    season.finaleDate && new Date(season.finaleDate).getTime() <= now);
  const ended = seasons[endedIndex];
  if (!ended?.finaleDate) {
    return { endedSeason: null, nextSeason: null, showNotice: false, history: 'none' };
  }
  const next = endedIndex > 0 ? seasons[endedIndex - 1] : undefined;

  const [castReady, leagues] = await Promise.all([
    next ? seasonCastReady(next.seasonId) : false,
    db
      .select({ status: leagueSchema.status, neverDrafted: leagueSchema.neverDrafted })
      .from(leagueMemberSchema)
      .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
      .where(and(
        eq(leagueMemberSchema.userId, userId),
        eq(leagueSchema.seasonId, ended.seasonId),
        isNotNull(leagueMemberSchema.draftOrder))),
  ]);

  const played = leagues.some(({ status, neverDrafted }) =>
    status === 'Active' || (status === 'Inactive' && !neverDrafted));
  const finaleDate = new Date(ended.finaleDate);

  return {
    endedSeason: { seasonId: ended.seasonId, name: ended.name, finaleDate: finaleDate.toISOString() },
    nextSeason: next
      ? { seasonId: next.seasonId, name: next.name, premiereDate: new Date(next.premiereDate).toISOString(), castReady }
      : null,
    // Once the next cast is out, new season notifications take over
    showNotice: now >= finaleDate.getTime() + NOTICE_DELAY_MS && !castReady,
    history: played ? 'played' : leagues.length > 0 ? 'unstarted' : 'none',
  };
}
