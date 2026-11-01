import 'server-only';

import { and, eq, isNotNull } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingDonationSchema } from '~/server/db/schema/funding';

/**
  * Mark a user's Buy Me a Coffee donations as thanked, so the thank you shows once
  * @param email The user's primary email
  */
export default async function thankDonations(email: string) {
  await db
    .update(fundingDonationSchema)
    .set({ thanked: true })
    .where(and(
      eq(fundingDonationSchema.email, email),
      isNotNull(fundingDonationSchema.bmacId),
      eq(fundingDonationSchema.thanked, false)));
}
