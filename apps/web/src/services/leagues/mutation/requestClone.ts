import 'server-only';

import { and, eq, isNull, lt, or } from 'drizzle-orm';
import { db } from '~/server/db';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import { sendPushToUser } from '~/services/notifications/push';
import { canRequestClone, cloneRequestCutoff, getPriorSeasonId } from '~/services/leagues/query/cloneRequest';
import { type VerifiedLeagueMemberAuth } from '~/types/api';

/**
  * Ask the league owner to clone the league for the new season, with a push to the owner.
  * Members and admins can ask once every two weeks, for leagues that played last season.
  * @param auth The member asking
  * @throws if they can't ask right now
  * @returnObj `{ success }`
  */
export default async function requestCloneLogic(auth: VerifiedLeagueMemberAuth) {
  const [league, member, owner, priorSeasonId] = await Promise.all([
    db
      .select({
        name: leagueSchema.name,
        hash: leagueSchema.hash,
        seasonId: leagueSchema.seasonId,
        status: leagueSchema.status,
        neverDrafted: leagueSchema.neverDrafted,
      })
      .from(leagueSchema)
      .where(eq(leagueSchema.leagueId, auth.leagueId))
      .then((rows) => rows[0]),
    db
      .select({
        role: leagueMemberSchema.role,
        displayName: leagueMemberSchema.displayName,
        cloneRequestedAt: leagueMemberSchema.cloneRequestedAt,
      })
      .from(leagueMemberSchema)
      .where(eq(leagueMemberSchema.memberId, auth.memberId))
      .then((rows) => rows[0]),
    db
      .select({ userId: leagueMemberSchema.userId })
      .from(leagueMemberSchema)
      .where(and(eq(leagueMemberSchema.leagueId, auth.leagueId), eq(leagueMemberSchema.role, 'Owner')))
      .then((rows) => rows[0]),
    getPriorSeasonId(),
  ]);

  if (!league || !member || !owner || !canRequestClone(league, member, priorSeasonId)) {
    throw new Error('Clone request not allowed');
  }

  // Claim the request; a second tap or device loses the race and sends nothing
  const claimed = await db
    .update(leagueMemberSchema)
    .set({ cloneRequestedAt: new Date() })
    .where(and(
      eq(leagueMemberSchema.memberId, auth.memberId),
      or(isNull(leagueMemberSchema.cloneRequestedAt), lt(leagueMemberSchema.cloneRequestedAt, cloneRequestCutoff()))))
    .returning({ memberId: leagueMemberSchema.memberId });
  if (claimed.length === 0) throw new Error('Clone request not allowed');

  await sendPushToUser(owner.userId, {
    title: `${member.displayName} wants to play again`,
    body: `Clone ${league.name} for the new season?`,
    data: { type: 'new_season_clone', leagueHash: league.hash },
  }, 'leagueActivity');

  return { success: true };
}
