import 'server-only';

import getAllSeasons from '~/services/seasons/query/allSeasons';
import { type LeagueMemberRole } from '~/types/leagueMembers';
import { type LeagueStatus } from '~/types/leagues';

// The test season, whose leagues always count as last season's in development
const TEST_SEASON_ID = -1;

// Members can ask the owner to clone a league once every this many days
export const CLONE_REQUEST_COOLDOWN_DAYS = 14;
const COOLDOWN_MS = CLONE_REQUEST_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/**
  * The season that most recently aired its finale; only its leagues can be asked to clone
  * @returns the season's id, or null before any season has ended
  */
export async function getPriorSeasonId(now = Date.now()) {
  // Newest first; the cache can hand dates back as strings
  const seasons = await getAllSeasons();
  return seasons.find((season) => season.finaleDate && new Date(season.finaleDate).getTime() <= now)?.seasonId ?? null;
}

/**
  * Whether a member can ask the owner to clone their league for the new season:
  * not the owner, the league drafted and ended last season, and they haven't asked
  * in the past two weeks. In development, the test season always counts as last season.
  * @param league The league
  * @param member The member asking
  * @param priorSeasonId The season that most recently ended (see getPriorSeasonId)
  */
export function canRequestClone(
  league: { seasonId: number; status: LeagueStatus; neverDrafted: boolean },
  member: { role: LeagueMemberRole; cloneRequestedAt: Date | null },
  priorSeasonId: number | null,
  now = Date.now(),
) {
  if (member.role === 'Owner') return false;
  if (league.status !== 'Inactive' || league.neverDrafted) return false;
  const isTestSeason = process.env.NODE_ENV === 'development' && league.seasonId === TEST_SEASON_ID;
  if (league.seasonId !== priorSeasonId && !isTestSeason) return false;
  return !member.cloneRequestedAt || now - member.cloneRequestedAt.getTime() >= COOLDOWN_MS;
}

/** Requests made before this can be made again */
export const cloneRequestCutoff = (now = Date.now()) => new Date(now - COOLDOWN_MS);
