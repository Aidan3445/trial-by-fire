import 'server-only';

import { db } from '~/server/db';
import { and, eq, inArray, isNotNull, sql } from 'drizzle-orm';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { fundingDonationSchema, fundingUserSchema } from '~/server/db/schema/funding';
import { type LeagueMember } from '~/types/leagueMembers';
import { type VerifiedLeagueMemberAuth } from '~/types/api';

/**
   * Get a league members by its hash
   * @param auth The authenticated league member
   * @returns the league members
   * @throws an error if the user is not authenticated
   * @returnObj `LeagueMember[]`
   */
export default async function getLeagueMembers(auth: VerifiedLeagueMemberAuth) {
  const members = await db
    .select({
      memberId: leagueMemberSchema.memberId,
      userId: leagueMemberSchema.userId,
      displayName: leagueMemberSchema.displayName,
      color: leagueMemberSchema.color,
      role: leagueMemberSchema.role,
      draftOrder: leagueMemberSchema.draftOrder,
      loggedIn: sql<boolean>`CASE WHEN 
         ${leagueMemberSchema.memberId} = ${auth.memberId}
         THEN true ELSE false END`.as('loggedIn'),
    })
    .from(leagueMemberSchema)
    .where(and(
      eq(leagueMemberSchema.leagueId, auth.leagueId),
      isNotNull(leagueMemberSchema.draftOrder)))
    .orderBy(leagueMemberSchema.draftOrder);

  // Separate lookups: a correlated subquery here loses its table names
  const userIds = members.map((member) => member.userId);
  const [donors, hidden] = userIds.length === 0 ? [[], []] : await Promise.all([
    db
      .selectDistinct({ userId: fundingDonationSchema.userId })
      .from(fundingDonationSchema)
      .where(and(inArray(fundingDonationSchema.userId, userIds), eq(fundingDonationSchema.refunded, false))),
    db
      .select({ userId: fundingUserSchema.userId })
      .from(fundingUserSchema)
      .where(and(inArray(fundingUserSchema.userId, userIds), eq(fundingUserSchema.hideBadge, true))),
  ]);
  const donorIds = new Set(donors.map((donor) => donor.userId));
  const hiddenIds = new Set(hidden.map((user) => user.userId));

  return members.map(({ userId, ...member }) => ({
    ...member,
    // override role for logged in user
    role: member.memberId === auth.memberId ? auth.role : member.role,
    donor: donorIds.has(userId) && !hiddenIds.has(userId),
  }) as LeagueMember);
}
