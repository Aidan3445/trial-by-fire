import z from 'zod';

export const SURVEY_RATING_MIN = 1;
export const SURVEY_RATING_MAX = 10;
export const SURVEY_EMAIL_MAX_LENGTH = 320;
export const SURVEY_COMMENTS_MAX_LENGTH = 2000;
// Wait this long on a finished league before asking
export const SURVEY_DELAY_MS = 60 * 1000;
// Only ask about the season that just ended, not leagues from years ago
export const SURVEY_RECENT_FINALE_MS = 90 * 24 * 60 * 60 * 1000;

export const PlayAgainOptions = ['No', 'Probably not', 'Maybe', 'Probably yes', 'Yes'] as const;
export type PlayAgain = (typeof PlayAgainOptions)[number];
// Answers that mean they won't be back, so we shouldn't ask them to donate
export const NotPlayingAgain: readonly PlayAgain[] = ['No', 'Probably not'];

export const MoreModesOptions = ['No', 'Maybe', 'Yes'] as const;
export type MoreModes = (typeof MoreModesOptions)[number];

// Basic shape only: something@something.something
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const isValidEmail = (email: string) => EMAIL_PATTERN.test(email.trim());

const Rating = z.number().int().min(SURVEY_RATING_MIN).max(SURVEY_RATING_MAX).nullable();

/** Every answer is optional and saved as soon as it's picked; null clears it */
export const SurveyAnswersZod = z.object({
  seasonRating: Rating,
  appRating: Rating,
  playAgain: z.enum(PlayAgainOptions).nullable(),
  moreModes: z.enum(MoreModesOptions).nullable(),
  email: z.string().trim().max(SURVEY_EMAIL_MAX_LENGTH)
    .refine(isValidEmail, { message: 'Enter a valid email' }).nullable(),
  comments: z.string().max(SURVEY_COMMENTS_MAX_LENGTH).nullable(),
}).partial();
export type SurveyAnswers = z.infer<typeof SurveyAnswersZod>;

export const SurveyUpdateZod = SurveyAnswersZod.extend({
  seasonId: z.number().int(),
});
export type SurveyUpdate = z.infer<typeof SurveyUpdateZod>;

export type SeasonSurvey = {
  seasonId: number;
  seasonRating: number | null;
  appRating: number | null;
  playAgain: PlayAgain | null;
  moreModes: MoreModes | null;
  email: string | null;
  comments: string | null;
  finished: boolean;
};

export type SurveyFinishResult = {
  // Ask for a donation toward next season now
  askDonation: boolean;
};

/**
  * Where things stand between seasons for one user.
  * `history` is how they took part in the season that ended:
  * - played: at least one of their leagues drafted
  * - unstarted: they only had leagues that never drafted
  * - none: they had no leagues that season
  */
export type OffseasonStatus = {
  endedSeason: { seasonId: number; name: string; finaleDate: string } | null;
  nextSeason: { seasonId: number; name: string; premiereDate: string; castReady: boolean } | null;
  // Show the season is over notice (a week after the finale, until the next cast is out)
  showNotice: boolean;
  history: 'played' | 'unstarted' | 'none';
};
