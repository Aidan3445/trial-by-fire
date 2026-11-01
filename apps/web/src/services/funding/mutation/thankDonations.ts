import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema } from '~/server/db/schema/funding';
import { donationsBy } from '~/services/funding/query/donationStatus';

/**
  * Mark a user's donations as thanked, so the thank you shows once
  * @param userId The user
  * @param email The user's primary email
  */
export default async function thankDonations(userId: string, email: string | null) {
  await db
    .update(fundingDonationSchema)
    .set({ thanked: true })
    .where(and(donationsBy(userId, email), eq(fundingDonationSchema.thanked, false)));
}
