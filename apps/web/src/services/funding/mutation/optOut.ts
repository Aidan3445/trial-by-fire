import 'server-only';

import { db } from '~/server/db';
import { fundingOptOutSchema } from '~/server/db/schema/funding';
import { getActiveSeasonId } from '~/services/funding/query/donationStatus';

/**
  * Stop asking a user to donate until a later season is active for them
  * @param userId The user
  * @returns whether there was an active season to opt out of
  */
export default async function optOutThisSeason(userId: string) {
  const seasonId = await getActiveSeasonId(userId);
  if (seasonId === null) return false;
  await db
    .insert(fundingOptOutSchema)
    .values({ userId, seasonId })
    .onConflictDoUpdate({ target: fundingOptOutSchema.userId, set: { seasonId } });
  return true;
}
