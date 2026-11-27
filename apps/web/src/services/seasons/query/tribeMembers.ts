import 'server-only';

import getTribesTimeline from '~/services/seasons/query/tribesTimeline';
import getEliminations from '~/services/seasons/query/eliminations';
import { findTribeCastaways } from '~/lib/utils';

/**
  * Get the tribe members of each tribe at a given episode
  * Uses the same membership rules as the event timeline and scoring,
  * so castaways eliminated before this episode are left out
  * @param seasonId The season id
  * @param episodeNumber The episode number
  * @returns the castaways and tribes that are active for the selected episode
  * @returnsObj `Record<tribeId, castawayId[]>`
  */
export default async function getTribeMembers(seasonId: number, episodeNumber: number) {
  const [tribesTimeline, eliminations] = await Promise.all([
    getTribesTimeline(seasonId),
    getEliminations(seasonId),
  ]);

  // only tribes that exist by this episode
  const tribeIds = new Set<number>();
  Object.entries(tribesTimeline).forEach(([ep, tribeUpdates]) => {
    if (parseInt(ep, 10) > episodeNumber) return;
    Object.keys(tribeUpdates).forEach((tribeId) => tribeIds.add(parseInt(tribeId, 10)));
  });

  const currentTribes: Record<number, number[]> = {};
  tribeIds.forEach((tribeId) => {
    currentTribes[tribeId] = findTribeCastaways(tribesTimeline, eliminations, tribeId, episodeNumber);
  });

  return currentTribes;
}
