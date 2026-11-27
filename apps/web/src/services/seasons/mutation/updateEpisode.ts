import 'server-only';

import { eq } from 'drizzle-orm';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { type Episode, type EpisodeUpdate } from '~/types/episodes';
import { revalidateTag } from 'next/cache';
import { scheduleEpisodeNotifications } from '~/services/notifications/reminders/episode';

/**
  * Update an episode, rescheduling its notifications if its air date or runtime changed
  * @param episode The episode fields to update
  * @throws if the episode cannot be updated
  * @returns The success status of the update
  * @returnObj `{ success }`
  */
export async function updateEpisodeLogic(
  episode: EpisodeUpdate
) {
  // Transaction to update the episode
  const { rescheduled } = await db.transaction(async (trx) => {
    const before = await trx
      .select({ airDate: episodeSchema.airDate, runtime: episodeSchema.runtime })
      .from(episodeSchema)
      .where(eq(episodeSchema.episodeId, episode.episodeId))
      .then((res) => res[0]);

    const update = await trx
      .update(episodeSchema)
      .set({
        ...episode,
        airDate: episode.airDate?.toUTCString(),
      })
      .where(eq(episodeSchema.episodeId, episode.episodeId))
      .returning({
        episodeId: episodeSchema.episodeId,
        episodeNumber: episodeSchema.episodeNumber,
        title: episodeSchema.title,
        airDate: episodeSchema.airDate,
        runtime: episodeSchema.runtime,
        seasonId: episodeSchema.seasonId,
        isMerge: episodeSchema.isMerge,
        isFinale: episodeSchema.isFinale,
      })
      .then((res) => res[0]);

    if (!update) throw new Error('Failed to update episode');

    // Season premiere and finale dates come from the episodes.
    // Expired right away so the sys admin editors show the change on their next fetch.
    revalidateTag('seasons', { expire: 0 });

    // Invalidate cache for the season's episodes
    revalidateTag(`episodes-${update.seasonId}`, { expire: 0 });

    // Jobs queued for the old time skip themselves, so queue new ones
    const moved = before?.airDate !== update.airDate || before.runtime !== update.runtime;
    const rescheduled: Episode | null = moved ? {
      ...update,
      airDate: new Date(`${update.airDate} Z`),
      airStatus: 'Upcoming',
    } : null;
    return { rescheduled };
  });

  // After the commit, so the jobs never see the old episode. Times already past are skipped.
  if (rescheduled) {
    try {
      await scheduleEpisodeNotifications(rescheduled);
    } catch (e) {
      console.error(`Failed to reschedule notifications for episode ${rescheduled.episodeId}`, e);
    }
  }

  return { success: true };
}
