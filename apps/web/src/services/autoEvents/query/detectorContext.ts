import 'server-only';

import getCurrentSeasons from '~/services/seasons/query/currentSeasons';
import getEpisodes from '~/services/seasons/query/episodes';
import getCastaways from '~/services/seasons/query/castaways';
import getTribes from '~/services/seasons/query/tribes';
import getTribeMembers from '~/services/seasons/query/tribeMembers';
import getEliminations from '~/services/seasons/query/eliminations';
import { db } from '~/server/db';
import { eq } from 'drizzle-orm';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type DetectorContext } from '~/types/events';
import { type Episode } from '~/types/episodes';

const HOST = 'Jeff Probst';

/**
  * Pick the episode a detector is watching: the one airing, else the last to air
  */
function watchedEpisode(episodes: Episode[]) {
  return episodes.find((episode) => episode.airStatus === 'Airing') ??
    episodes.findLast((episode) => episode.airStatus === 'Aired') ??
    null;
}

/**
  * Get the names a caption detector needs for an episode
  * @param seasonId The season, or null for the current season with an airing or most recent episode
  * @param episodeNumber The episode, or null for the one airing or last aired
  * @returns The detector context, or null if no such episode
  * @returnObj `DetectorContext | null`
  */
export default async function getDetectorContext(
  seasonId: number | null,
  episodeNumber: number | null
): Promise<DetectorContext | null> {
  let season: { seasonId: number; name: string } | null = null;
  let episodes: Episode[] = [];

  if (seasonId) {
    season = await db
      .select({ seasonId: seasonSchema.seasonId, name: seasonSchema.name })
      .from(seasonSchema)
      .where(eq(seasonSchema.seasonId, seasonId))
      .then((rows) => rows[0] ?? null);
    if (season) episodes = await getEpisodes(season.seasonId);
  } else {
    // The current season whose watched episode aired most recently
    let latest = -Infinity;
    for (const current of await getCurrentSeasons()) {
      const seasonEpisodes = await getEpisodes(current.seasonId);
      const watched = watchedEpisode(seasonEpisodes);
      const airTime = watched ? new Date(watched.airDate).getTime() : -Infinity;
      if (airTime > latest) {
        latest = airTime;
        season = { seasonId: current.seasonId, name: current.name };
        episodes = seasonEpisodes;
      }
    }
  }
  if (!season) return null;

  const episode = episodeNumber
    ? episodes.find((ep) => ep.episodeNumber === episodeNumber) ?? null
    : watchedEpisode(episodes);
  if (!episode) return null;

  const [castaways, tribes, tribeMembers, eliminations] = await Promise.all([
    getCastaways(season.seasonId),
    getTribes(season.seasonId),
    getTribeMembers(season.seasonId, episode.episodeNumber),
    getEliminations(season.seasonId),
  ]);

  const seasonCast = castaways.filter((castaway) => castaway.seasonId === season.seasonId);
  // Out before this episode starts
  const eliminatedIds = new Set(eliminations
    .slice(0, episode.episodeNumber)
    .flat()
    .map((elim) => elim.castawayId));

  const activeTribes = Object.entries(tribeMembers)
    .filter(([, members]) => members.some((id) => !eliminatedIds.has(id)))
    .map(([tribeId]) => tribes.find((tribe) => tribe.tribeId === Number(tribeId))?.tribeName)
    .filter((name): name is string => !!name);

  return {
    seasonId: season.seasonId,
    seasonName: season.name,
    episodeId: episode.episodeId,
    episodeNumber: episode.episodeNumber,
    title: episode.title || null,
    host: HOST,
    cast: seasonCast
      .filter((castaway) => !eliminatedIds.has(castaway.castawayId))
      .map((castaway) => castaway.shortName),
    eliminated: seasonCast
      .filter((castaway) => eliminatedIds.has(castaway.castawayId))
      .map((castaway) => castaway.shortName),
    // After the merge there is one tribe, and naming it adds nothing
    tribes: activeTribes.length > 1 ? activeTribes : [],
  };
}
