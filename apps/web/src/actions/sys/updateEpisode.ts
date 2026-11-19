'use server';

import { requireSystemAdminAuth } from '~/lib/auth';
import { updateEpisodeLogic } from '~/services/seasons/mutation/updateEpisode';
import { type EpisodeUpdate } from '~/types/episodes';

/**
  * Update an episode
  * @param episode The episode fields to update
  */
export default async function updateEpisode(episode: EpisodeUpdate) {
  try {
    return await requireSystemAdminAuth(updateEpisodeLogic)(episode);
  } catch (e) {
    let message: string;
    if (e instanceof Error) message = e.message;
    else message = String(e);

    if (message.includes('User not authenticated')) throw e;

    console.error('Failed to update episode', e);
    throw new Error('An error occurred while updating the episode.');
  }
}
