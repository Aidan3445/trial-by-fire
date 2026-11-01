import 'server-only';

import { and, eq, isNotNull, isNull } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema } from '~/server/db/schema/funding';

/**
  * Attach Buy Me a Coffee donations from a user's email to their account,
  * so other members can see their crown
  * @param userId The user
  * @param email The user's primary email
  */
export default async function linkDonations(userId: string, email: string) {
  await db
    .update(fundingDonationSchema)
    .set({ userId })
    .where(and(
      eq(fundingDonationSchema.email, email),
      isNotNull(fundingDonationSchema.bmacId),
      isNull(fundingDonationSchema.userId)));
}
