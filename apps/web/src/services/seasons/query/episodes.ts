import 'server-only';

import { db } from '~/server/db';
import { asc, eq } from 'drizzle-orm';
import { episodeSchema } from '~/server/db/schema/episodes';
import { type Episode } from '~/types/episodes';
import { unstable_cache } from 'next/cache';
import { getAirStatus } from '~/lib/episodes';
import { type DBTransaction } from '~/types/server';

/**
  * Get the episodes for a season and caches the result
  * @param seasonId The season id
  * @param transactionOverride Optional transaction override
  * @returns the episodes starting from the next episode to air sorted by air date in descending order
  * @returnsObj `Episode[]`
  */
export default async function getEpisodes(
  seasonId: number,
  transactionOverride?: DBTransaction
) {
  // Bypass cache when inside a transaction to ensure fresh airStatus
  if (transactionOverride) {
    return fetchEpisodes(seasonId, transactionOverride);
  }

  return unstable_cache(
    async (seasonId: number) => fetchEpisodes(seasonId),
    // Separate entries so toggling DEV_FAKE_AIRING doesn't serve the other state
    ['episodes', seasonId.toString(), fakeAiringSetting() ?? 'real'],
    {
      revalidate: 60, // 1 minute
      tags: [`episodes-${seasonId}`, 'episodes']
    }
  )(seasonId);
}

async function fetchEpisodes(seasonId: number, transactionOverride?: DBTransaction) {
  const episodes = await (transactionOverride ?? db)
    .select()
    .from(episodeSchema)
    .where(eq(episodeSchema.seasonId, seasonId))
    .orderBy(asc(episodeSchema.airDate));

  const processedEpisodes = episodes.map(episode => {
    const airDate = new Date(`${episode.airDate} Z`);
    const airStatus = getAirStatus(airDate, episode.runtime);

    return {
      seasonId: episode.seasonId,
      episodeId: episode.episodeId,
      episodeNumber: episode.episodeNumber,
      title: episode.title,
      airDate,
      runtime: episode.runtime,
      airStatus,
      isMerge: episode.isMerge,
      isFinale: episode.isFinale,
    } as Episode;
  });

  return fakeAiring(processedEpisodes);
}

/**
  * DEV_FAKE_AIRING, outside production only: 'true' for the latest aired
  * episode, or an episode number
  */
function fakeAiringSetting() {
  if (process.env.NODE_ENV === 'production') return null;
  const setting = process.env.DEV_FAKE_AIRING?.trim();
  return setting && setting !== 'false' ? setting : null;
}

/**
  * Dev only: make an episode look like it started 10 minutes ago so the airing
  * UI can be tested with its real events and predictions. Moves the air date
  * rather than just the status, since clients work out air status from it too.
  */
function fakeAiring(episodes: Episode[]) {
  const setting = fakeAiringSetting();
  if (!setting) return episodes;

  const episodeNumber = Number(setting);
  const target = Number.isInteger(episodeNumber) && episodeNumber > 0
    ? episodes.find((episode) => episode.episodeNumber === episodeNumber)
    : episodes.findLast((episode) => episode.airStatus !== 'Upcoming');
  if (!target) return episodes;

  const airDate = new Date(Date.now() - 10 * 60 * 1000);
  return episodes.map((episode) => {
    if (episode === target) return { ...episode, airDate, airStatus: 'Airing' as const };
    // Later episodes can't have aired yet
    if (episode.episodeNumber > target.episodeNumber && episode.airStatus !== 'Upcoming') {
      return { ...episode, airStatus: 'Upcoming' as const };
    }
    return episode;
  });
}
