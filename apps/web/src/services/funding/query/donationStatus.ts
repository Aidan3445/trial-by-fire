import 'server-only';

import { and, desc, eq, or, sum } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema, fundingUserSchema } from '~/server/db/schema/funding';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import { seasonSchema } from '~/server/db/schema/seasons';
import getAllSeasons from '~/services/seasons/query/allSeasons';
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
  * The latest season to premiere by a date, so donations after a finale still count toward it
  * @param date When the donation was made
  * @returns the season id, or null if no season had premiered
  */
export async function getSeasonIdAt(date: Date) {
  // Newest first; the cache can hand dates back as strings
  const seasons = await getAllSeasons();
  return seasons.find((season) => new Date(season.premiereDate) <= date)?.seasonId ?? null;
}

/**
  * Donations from a user's email, or that they reported themselves before the webhook
  * @param userId The user
  * @param email The user's primary email
  */
export function donationsBy(userId: string, email: string | null) {
  return email
    ? or(eq(fundingDonationSchema.userId, userId), eq(fundingDonationSchema.email, email))
    : eq(fundingDonationSchema.userId, userId);
}

/**
  * Whether a user has donated this season or any earlier one, said not to ask
  * again this season, or has donations to thank them for
  * @param userId The user
  * @param email The user's primary email
  * @returnObj `DonationStatus`
  */
export default async function getDonationStatus(userId: string, email: string | null): Promise<DonationStatus> {
  const [seasonId, donations, unthanked, preferences] = await Promise.all([
    getActiveSeasonId(userId),
    db
      .select({ seasonId: fundingDonationSchema.seasonId })
      .from(fundingDonationSchema)
      .where(and(donationsBy(userId, email), eq(fundingDonationSchema.refunded, false))),
    db
      .select({ total: sum(fundingDonationSchema.amount) })
      .from(fundingDonationSchema)
      .where(and(
        donationsBy(userId, email),
        eq(fundingDonationSchema.refunded, false),
        eq(fundingDonationSchema.thanked, false)))
      .then((rows) => rows[0]?.total ?? null),
    db
      .select({ optOutSeasonId: fundingUserSchema.optOutSeasonId, hideBadge: fundingUserSchema.hideBadge })
      .from(fundingUserSchema)
      .where(eq(fundingUserSchema.userId, userId))
      .then((rows) => rows[0]),
  ]);

  return {
    seasonId,
    donatedThisSeason: seasonId !== null && donations.some((donation) => donation.seasonId === seasonId),
    donatedBefore: donations.some((donation) => donation.seasonId !== seasonId),
    optedOut: seasonId !== null && preferences?.optOutSeasonId === seasonId,
    hideBadge: preferences?.hideBadge ?? false,
    unthanked: unthanked === null ? null : Number(unthanked),
  };
}
