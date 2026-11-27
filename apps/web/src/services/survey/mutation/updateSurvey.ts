import 'server-only';

import { db } from '~/server/db';
import { seasonSurveySchema } from '~/server/db/schema/survey';
import { type SurveyUpdate } from '~/types/survey';

/**
  * Save survey answers as they're picked. With no answers, just records that
  * the survey was shown so it isn't shown again.
  * @param userId The user
  * @param update The season and any answers to save; null clears an answer
  * @returnObj `{ success }`
  */
export default async function updateSurveyLogic(userId: string, update: SurveyUpdate) {
  const { seasonId, ...answers } = update;
  // Blank text clears the answer
  const blankToNull = (text: string | null | undefined) => text === undefined ? undefined : text?.trim() ? text.trim() : null;
  const cleaned = { ...answers, email: blankToNull(answers.email), comments: blankToNull(answers.comments) };
  const set = Object.fromEntries(Object.entries(cleaned).filter(([, value]) => value !== undefined));

  const insert = db
    .insert(seasonSurveySchema)
    .values({ userId, seasonId, ...set });
  await (Object.keys(set).length > 0
    ? insert.onConflictDoUpdate({ target: [seasonSurveySchema.userId, seasonSurveySchema.seasonId], set })
    : insert.onConflictDoNothing());

  return { success: true };
}
