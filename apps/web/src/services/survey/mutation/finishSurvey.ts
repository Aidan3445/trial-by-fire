import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { fundingUserSchema } from '~/server/db/schema/funding';
import { seasonSurveySchema } from '~/server/db/schema/survey';
import { NotPlayingAgain, type SurveyFinishResult } from '~/types/survey';

/**
  * Close out a user's survey and decide whether to ask them to donate.
  * Skipping every question or saying they likely won't play again counts as
  * declining this season's donation ask, so they aren't asked again.
  * @param userId The user
  * @param seasonId The season the survey is about
  * @returnObj `SurveyFinishResult`
  */
export default async function finishSurveyLogic(userId: string, seasonId: number): Promise<SurveyFinishResult> {
  return db.transaction(async (trx) => {
    // Only the first finish decides; a repeat (or a survey that was never shown) asks nothing
    const survey = await trx
      .update(seasonSurveySchema)
      .set({ finished: true })
      .where(and(
        eq(seasonSurveySchema.userId, userId),
        eq(seasonSurveySchema.seasonId, seasonId),
        eq(seasonSurveySchema.finished, false)))
      .returning({
        seasonRating: seasonSurveySchema.seasonRating,
        appRating: seasonSurveySchema.appRating,
        playAgain: seasonSurveySchema.playAgain,
        moreModes: seasonSurveySchema.moreModes,
        email: seasonSurveySchema.email,
        comments: seasonSurveySchema.comments,
      })
      .then((rows) => rows[0]);
    if (!survey) return { askDonation: false };

    const answered = Object.values(survey).some((answer) => answer !== null);
    const { playAgain } = survey;
    const declined = !answered || (playAgain !== null && NotPlayingAgain.includes(playAgain));

    if (declined) {
      await trx
        .insert(fundingUserSchema)
        .values({ userId, optOutSeasonId: seasonId })
        .onConflictDoUpdate({ target: fundingUserSchema.userId, set: { optOutSeasonId: seasonId } });
      return { askDonation: false };
    }

    // They may have said not to ask again during the season
    const optOutSeasonId = await trx
      .select({ optOutSeasonId: fundingUserSchema.optOutSeasonId })
      .from(fundingUserSchema)
      .where(eq(fundingUserSchema.userId, userId))
      .then((rows) => rows[0]?.optOutSeasonId ?? null);
    return { askDonation: optOutSeasonId !== seasonId };
  });
}
