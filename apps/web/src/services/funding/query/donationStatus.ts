import 'server-only';

import { and, desc, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema } from '~/server/db/schema/funding';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type DonationStatus } from '~/types/funding';

/**
  * The season of a user's active leagues, newest first
  * @param userId The user
  * @returns the season id, or null if they have no active league
  */
export async function getActiveSeasonId(userId: string) {
  return db
    .select({ seasonId: leagueSchema.seasonId })
    .from(leagueMemberSchema)
    .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
    .innerJoin(seasonSchema, eq(seasonSchema.seasonId, leagueSchema.seasonId))
    .where(and(eq(leagueMemberSchema.userId, userId), eq(leagueSchema.status, 'Active')))
    .orderBy(desc(seasonSchema.premiereDate))
    .limit(1)
    .then((rows) => rows[0]?.seasonId ?? null);
}

/**
  * Whether a user has reported donating this season or any earlier one
  * @param userId The user
  * @returnObj `DonationStatus`
  */
export default async function getDonationStatus(userId: string): Promise<DonationStatus> {
  const [seasonId, donations] = await Promise.all([
    getActiveSeasonId(userId),
    db
      .select({ seasonId: fundingDonationSchema.seasonId })
      .from(fundingDonationSchema)
      .where(eq(fundingDonationSchema.userId, userId)),
  ]);

  return {
    seasonId,
    donatedThisSeason: seasonId !== null && donations.some((donation) => donation.seasonId === seasonId),
    donatedBefore: donations.some((donation) => donation.seasonId !== seasonId),
  };
}
