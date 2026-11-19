import 'server-only';
import { db } from '~/server/db';
import { eq, and, isNotNull } from 'drizzle-orm';
import { episodeSchema } from '~/server/db/schema/episodes';
import { leagueSchema } from '~/server/db/schema/leagues';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { sendPushToUsers } from '~/services/notifications/push';
import { type Episode } from '~/types/episodes';
import endFinishedSeasons from '~/services/seasons/mutation/endSeason';
import { getUsersNeedingReminders } from '~/services/users/query/usersNeedingReminders';

/**
 * Check a scheduled job against the episode as it is now.
 * The job is stale if the episode moved (or, for jobs timed off the runtime, its runtime changed),
 * since updating the episode schedules a replacement. Other edits, like a title fix, don't matter.
 * @param scheduled The episode as it was when the job was scheduled
 * @param timedByRuntime Whether the job's send time depends on the runtime
 * @returns the current episode to send with, or null if the job is stale
 */
async function currentEpisode(scheduled: Episode, timedByRuntime = false): Promise<Episode | null> {
  const current = await db
    .select({
      episodeId: episodeSchema.episodeId,
      episodeNumber: episodeSchema.episodeNumber,
      title: episodeSchema.title,
      airDate: episodeSchema.airDate,
      runtime: episodeSchema.runtime,
      seasonId: episodeSchema.seasonId,
      isMerge: episodeSchema.isMerge,
      isFinale: episodeSchema.isFinale,
    })
    .from(episodeSchema)
    .where(eq(episodeSchema.episodeId, scheduled.episodeId))
    .then((res) => res[0]);

  if (!current) {
    console.log(
      `Skipping notification - episodeId ${scheduled.episodeId} not found`,
      { scheduled }
    );
    return null;
  }

  const currentAirDate = new Date(`${current.airDate} Z`);
  if (
    new Date(scheduled.airDate).getTime() !== currentAirDate.getTime() ||
    scheduled.seasonId !== current.seasonId ||
    (timedByRuntime && scheduled.runtime !== current.runtime)
  ) {
    console.log(
      `Skipping notification - episodeId ${scheduled.episodeId} was rescheduled`,
      { scheduled, current }
    );
    return null;
  }

  return { ...scheduled, ...current, airDate: currentAirDate };
}

/**
 * Send reminder notifications to users who haven't made predictions
 */
export async function sendReminderNotifications(
  timing: 'midweek' | '8hr' | '15min',
  scheduled: Episode,
) {
  const episode = await currentEpisode(scheduled);
  if (!episode) return;

  // Get users in active leagues for this season
  const { predictionUsers, secondaryUsers, bothUsers } = await getUsersNeedingReminders(episode);
  console.log(`Sending ${timing} reminders for episode ${episode.episodeId} 
to ${predictionUsers.length} prediction users 
to ${secondaryUsers.length} secondary users
and ${bothUsers.length} users needing both`);

  const predictionMessages = {
    'midweek': {
      title: 'Predictions Reminder',
      body: `Don't forget to make your predictions for Episode ${episode.episodeNumber} - ${episode.title}!`,
    },
    '8hr': {
      title: 'Episode Tonight!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} airs in 8 hours. Make your predictions!`,
    },
    '15min': {
      title: 'Last Chance!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} starts in 15 minutes. Lock in your predictions now!`,
    },
  };

  const secondaryMessages = {
    'midweek': {
      title: 'Secondary Pick Reminder',
      body: `Don't forget to make your secondary pick for Episode ${episode.episodeNumber} - ${episode.title}!`,
    },
    '8hr': {
      title: 'Episode Tonight!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} airs in 8 hours. Make your secondary pick!`,
    },
    '15min': {
      title: 'Last Chance!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} starts in 15 minutes. Lock in your secondary pick now!`,
    },
  };

  const bothMessages = {
    'midweek': {
      title: 'Predictions Reminder',
      body: `Don't forget to make your predictions and secondary pick for Episode ${episode.episodeNumber} - ${episode.title}!`,
    },
    '8hr': {
      title: 'Episode Tonight!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} airs in 8 hours. Make your predictions and secondary pick!`,
    },
    '15min': {
      title: 'Last Chance!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} starts in 15 minutes. Lock in your predictions and secondary pick now!`,
    },
  };

  await Promise.all([
    sendPushToUsers(
      predictionUsers,
      {
        ...predictionMessages[timing],
        data: { type: 'reminder', episodeId: episode.episodeId, timing },
        collapseId: `prediction-reminder-${episode.episodeId}`,
      },
      'reminders',
    ),
    sendPushToUsers(
      secondaryUsers,
      {
        ...secondaryMessages[timing],
        data: { type: 'reminder_secondary', episodeId: episode.episodeId, timing },
        collapseId: `prediction-reminder-${episode.episodeId}`,
      },
      'reminders',
    ),
    sendPushToUsers(
      bothUsers,
      {
        ...bothMessages[timing],
        data: { type: 'reminder_both', episodeId: episode.episodeId, timing },
        collapseId: `prediction-reminder-${episode.episodeId}`,
      },
      'reminders',
    )
  ]);
}

/**
 * Send "episode starting" notification for live scoring opt-in
 */
export async function sendEpisodeStartingNotifications(scheduled: Episode) {
  const episode = await currentEpisode(scheduled);
  if (!episode) return;

  const users = await db
    .selectDistinct({ userId: leagueMemberSchema.userId })
    .from(leagueMemberSchema)
    .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
    .where(and(
      eq(leagueSchema.seasonId, episode.seasonId),
      eq(leagueSchema.status, 'Active'),
      isNotNull(leagueMemberSchema.draftOrder),
    ));

  if (users.length === 0) return;

  await sendPushToUsers(
    users.map((u) => u.userId),
    {
      title: 'Episode Starting!',
      body: `Episode ${episode.episodeNumber} - ${episode.title} is starting. Tap to enable live scoring updates.`,
      data: { type: 'live_scoring_optin', episodeId: episode.episodeId },
      collapseId: `episode-${episode.episodeId}`,
    },
    'episodeUpdates',
  );
}

/**
 * Send ambiguous "episode finished" notification
 */
export async function sendEpisodeFinishedNotifications(scheduled: Episode) {
  const episode = await currentEpisode(scheduled, true);
  if (!episode) return;

  const users = await db
    .selectDistinct({ userId: leagueMemberSchema.userId })
    .from(leagueMemberSchema)
    .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
    .where(and(
      eq(leagueSchema.seasonId, episode.seasonId),
      eq(leagueSchema.status, 'Active'),
      isNotNull(leagueMemberSchema.draftOrder),
    ));

  if (users.length > 0) {
    await sendPushToUsers(
      users.map((u) => u.userId),
      {
        title: 'Episode Finished',
        body: 'Check your leagues to see what happened to the leaderboard!',
        data: { type: 'episode_finished', episodeId: episode.episodeId },
        collapseId: `episode-${episode.episodeId}`,
      },
      'episodeUpdates',
    );
  }

  // The finale just ended: end the season's leagues so the podium shows.
  // Checks the database, so a stale isFinale here doesn't matter.
  try {
    await endFinishedSeasons(episode.seasonId);
  } catch (e) {
    console.error(`Failed to end leagues after episode ${episode.episodeId}`, e);
  }
}
