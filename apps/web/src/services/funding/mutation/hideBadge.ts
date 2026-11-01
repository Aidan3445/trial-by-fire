import 'server-only';

import { db } from '~/server/db';
import { fundingUserSchema } from '~/server/db/schema/funding';

/**
  * Hide or show a user's donor crown for everyone
  * @param userId The user
  * @param hidden Whether to hide it
  */
export default async function setBadgeHidden(userId: string, hidden: boolean) {
  await db
    .insert(fundingUserSchema)
    .values({ userId, hideBadge: hidden })
    .onConflictDoUpdate({ target: fundingUserSchema.userId, set: { hideBadge: hidden } });
}
