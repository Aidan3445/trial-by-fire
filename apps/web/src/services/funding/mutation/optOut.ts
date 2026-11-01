import 'server-only';

import { db } from '~/server/db';
import { fundingUserSchema } from '~/server/db/schema/funding';
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
    .insert(fundingUserSchema)
    .values({ userId, optOutSeasonId: seasonId })
    .onConflictDoUpdate({ target: fundingUserSchema.userId, set: { optOutSeasonId: seasonId } });
  return true;
}
