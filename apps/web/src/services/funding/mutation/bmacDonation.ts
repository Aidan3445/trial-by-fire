import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema, fundingSchema } from '~/server/db/schema/funding';
import getFunding from '~/services/funding/query/funding';
import { getSeasonIdAt } from '~/services/funding/query/donationStatus';
import { type FundingGoal } from '~/types/funding';

// The parts of a Buy Me a Coffee donation we use 
export type BmacDonation = {
  id: string | number;
  amount: string | number;
  supporter_email?: string | null;
  created_at?: string | number | null;
};

// The first unmet goal, else the first 
function pickGoal(goals: FundingGoal[]) {
  return goals.find((goal) => !goal.fulfilled) ?? goals[0];
}

// Buy Me a Coffee sends unix seconds; fall back to now if it's missing or unreadable
function donatedAt(createdAt: BmacDonation['created_at']) {
  if (createdAt === null || createdAt === undefined) return new Date();
  const date = typeof createdAt === 'number' ? new Date(createdAt * 1000) : new Date(createdAt);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

/**
  * Record a donation Buy Me a Coffee told us about. Safe to call again for the same donation.
  * @param donation The donation from the webhook
  */
export async function recordBmacDonation(donation: BmacDonation) {
  const bmacId = `${donation.id}`;
  const amount = Number(donation.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new Error(`Invalid amount for donation ${bmacId}`);

  const existing = await db
    .select({ donationId: fundingDonationSchema.donationId })
    .from(fundingDonationSchema)
    .where(eq(fundingDonationSchema.bmacId, bmacId))
    .then((rows) => rows[0]);
  if (existing) return;

  const supporterEmail = donation.supporter_email?.trim().toLowerCase() ?? '';
  const email = supporterEmail.length > 0 ? supporterEmail : null;
  const created = donatedAt(donation.created_at);

  const { goals } = await getFunding();
  const target = pickGoal(goals);
  const seasonId = await getSeasonIdAt(created);

  await db.transaction(async (trx) => {
    // A retry racing this one loses here instead of counting twice
    const inserted = await trx
      .insert(fundingDonationSchema)
      .values({ email, fundingId: target?.fundingId ?? null, seasonId, amount: amount.toFixed(2), bmacId })
      .onConflictDoNothing({ target: fundingDonationSchema.bmacId })
      .returning({ donationId: fundingDonationSchema.donationId });
    if (inserted.length > 0 && target) {
      await trx
        .update(fundingSchema)
        .set({ coverage: sql`${fundingSchema.coverage} + ${amount.toFixed(2)}` })
        .where(eq(fundingSchema.fundingId, target.fundingId));
    }
  });
}

/**
  * Take a refunded donation back out of its goal. Safe to call again.
  * @param donation The refunded donation from the webhook
  */
export async function refundBmacDonation(donation: BmacDonation) {
  const bmacId = `${donation.id}`;
  await db.transaction(async (trx) => {
    const [refunded] = await trx
      .update(fundingDonationSchema)
      .set({ refunded: true })
      .where(and(eq(fundingDonationSchema.bmacId, bmacId), eq(fundingDonationSchema.refunded, false)))
      .returning({ fundingId: fundingDonationSchema.fundingId, amount: fundingDonationSchema.amount });
    // Unknown (from before the webhook) or already refunded
    if (!refunded?.fundingId) return;
    await trx
      .update(fundingSchema)
      .set({ coverage: sql`GREATEST(${fundingSchema.coverage} - ${refunded.amount}, 0)` })
      .where(eq(fundingSchema.fundingId, refunded.fundingId));
  });
}
