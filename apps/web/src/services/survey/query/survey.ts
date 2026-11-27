import 'server-only';

import { and, eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { seasonSurveySchema } from '~/server/db/schema/survey';
import { type SeasonSurvey } from '~/types/survey';

/**
  * A user's end of season survey
  * @param userId The user
  * @param seasonId The season it's about
  * @returns the survey, or null if they haven't been asked yet
  * @returnObj `SeasonSurvey | null`
  */
export default async function getSurvey(userId: string, seasonId: number): Promise<SeasonSurvey | null> {
  return db
    .select({
      seasonId: seasonSurveySchema.seasonId,
      seasonRating: seasonSurveySchema.seasonRating,
      appRating: seasonSurveySchema.appRating,
      playAgain: seasonSurveySchema.playAgain,
      moreModes: seasonSurveySchema.moreModes,
      email: seasonSurveySchema.email,
      comments: seasonSurveySchema.comments,
      finished: seasonSurveySchema.finished,
    })
    .from(seasonSurveySchema)
    .where(and(eq(seasonSurveySchema.userId, userId), eq(seasonSurveySchema.seasonId, seasonId)))
    .then((rows) => rows[0] ?? null);
}
