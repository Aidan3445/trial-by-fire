import 'server-only';

import { boolean, integer, primaryKey, smallint, varchar } from 'drizzle-orm/pg-core';
import { createTable } from '~/server/db/schema/createTable';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type MoreModes, type PlayAgain, SURVEY_COMMENTS_MAX_LENGTH, SURVEY_EMAIL_MAX_LENGTH } from '~/types/survey';

// End of season feedback, one row per user per season. The row is made when the
// survey is first shown, and each answer is saved as soon as it's picked.
export const seasonSurveySchema = createTable(
  'season_survey',
  {
    userId: varchar('user_id', { length: 64 }).notNull(),
    seasonId: integer('season_id').references(() => seasonSchema.seasonId, { onDelete: 'cascade' }).notNull(),
    // 1-10
    seasonRating: smallint('season_rating'),
    appRating: smallint('app_rating'),
    playAgain: varchar('play_again', { length: 16 }).$type<PlayAgain>(),
    moreModes: varchar('more_modes', { length: 16 }).$type<MoreModes>(),
    email: varchar('email', { length: SURVEY_EMAIL_MAX_LENGTH }),
    comments: varchar('comments', { length: SURVEY_COMMENTS_MAX_LENGTH }),
    // They closed it, done or not
    finished: boolean('finished').notNull().default(false),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.seasonId] }),
  ]
);
