import 'server-only';

import { eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema, fundingSchema } from '~/server/db/schema/funding';
import getFunding from '~/services/funding/query/funding';
import { getActiveSeasonId } from '~/services/funding/query/donationStatus';
import { type DonationReport } from '~/types/funding';

/**
  * Record a donation a user says they made and add it to a goal's coverage.
  * Reports are self-reported, so each is logged to check against Buy Me a Coffee.
  * @param userId The user reporting it
  * @param report The amount and, optionally, the goal it's for
  * @returns the updated funding
  * @returnObj `Funding`
  */
export default async function reportDonationLogic(userId: string, report: DonationReport) {
  const { goals } = await getFunding();
  const target = report.fundingId
    ? goals.find((goal) => goal.fundingId === report.fundingId)
    : goals.find((goal) => !goal.fulfilled) ?? goals[0];
  if (report.fundingId && !target) throw new Error('Funding goal not found');

  const seasonId = await getActiveSeasonId(userId);
  const amount = report.amount.toFixed(2);

  await db.transaction(async (trx) => {
    await trx.insert(fundingDonationSchema).values({
      userId,
      fundingId: target?.fundingId ?? null,
      seasonId,
      amount,
    });
    if (target) {
      await trx
        .update(fundingSchema)
        .set({ coverage: sql`${fundingSchema.coverage} + ${amount}` })
        .where(eq(fundingSchema.fundingId, target.fundingId));
    }
  });

  return getFunding();
}
