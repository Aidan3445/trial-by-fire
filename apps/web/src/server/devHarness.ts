import 'server-only';

import { randomUUID } from 'crypto';
import { readFileSync, writeFileSync } from 'fs';
import path from 'path';
import { cookies } from 'next/headers';
import { type Episode, type EpisodeOverrideConfig } from '~/types/episodes';
import { type LeagueStatus } from '~/types/leagues';

/*
 * Dev harness: a development-only layer that sits between the real data and the
 * API responses. Services pass their real results through it at the edge
 * (`devHarness.episodes`, `devHarness.league`), and it swaps in the episode
 * override when one is active. Everything derived from those results (key episodes,
 * seasons data, prediction timing, league auth) picks the override up for free.
 *
 * State lives in a gitignored JSON file next to the app so it survives dev server
 * restarts. Outside development every function here is a no-op.
 *
 * - Broadcast off: the override only applies to the device that set it (owner cookie).
 * - Broadcast on: the override applies to every request the dev server answers.
 */

export const isDevHarnessEnabled = process.env.NODE_ENV === 'development';

export const HARNESS_OWNER_COOKIE = 'dev-harness-owner';
const STATE_FILE = path.join(process.cwd(), '.dev-harness.json');

export type DevHarnessState = {
  /** Bumped on every change so clients know to reset their caches */
  version: number;
  config: EpisodeOverrideConfig | null;
  broadcast: boolean;
  /** Owner cookie of the device that last set the override */
  ownerId: string | null;
};

const EMPTY_STATE: DevHarnessState = { version: 0, config: null, broadcast: false, ownerId: null };

export function readHarnessState(): DevHarnessState {
  if (!isDevHarnessEnabled) return EMPTY_STATE;
  try {
    return { ...EMPTY_STATE, ...JSON.parse(readFileSync(STATE_FILE, 'utf8')) as Partial<DevHarnessState> };
  } catch {
    return EMPTY_STATE;
  }
}

export function writeHarnessState(update: Partial<Omit<DevHarnessState, 'version'>>): DevHarnessState {
  const next: DevHarnessState = {
    ...readHarnessState(),
    ...update,
    version: Date.now(),
  };
  writeFileSync(STATE_FILE, JSON.stringify(next, null, 2));
  return next;
}

/** Owner id for the current request, or null outside a request scope */
export async function getHarnessOwnerId(): Promise<string | null> {
  try {
    return (await cookies()).get(HARNESS_OWNER_COOKIE)?.value ?? null;
  } catch {
    return null;
  }
}

export function newHarnessOwnerId() {
  return randomUUID();
}

/** The override that applies to the current request, if any */
export async function getActiveOverride(state = readHarnessState()): Promise<EpisodeOverrideConfig | null> {
  if (!isDevHarnessEnabled || !state.config?.enabled) return null;
  if (state.broadcast) return state.config;
  const ownerId = await getHarnessOwnerId();
  return ownerId && ownerId === state.ownerId ? state.config : null;
}

// ---------------------------------------------------------------------------
// Transforms
// ---------------------------------------------------------------------------

const MINUTE = 60 * 1000;
const WEEK = 7 * 24 * 60 * MINUTE;

function overrideEpisodes(config: EpisodeOverrideConfig, episodes: Episode[]): Episode[] {
  // No next episode simulates a season with no episodes yet
  if (config.nextEpisodeId === null) return [];

  const previousEp = episodes.find((ep) => ep.episodeId === config.previousEpisodeId) ?? null;
  const nextEp = episodes.find((ep) => ep.episodeId === config.nextEpisodeId) ?? null;
  const mergeEp = episodes.find((ep) => ep.episodeId === config.mergeEpisodeId) ?? null;
  const now = Date.now();

  return episodes.map((ep) => {
    const updated = { ...ep, airDate: new Date(ep.airDate) };

    if (ep.episodeId === previousEp?.episodeId) {
      updated.airStatus = config.previousAirStatus;
    } else if (nextEp && ep.episodeNumber >= nextEp.episodeNumber) {
      updated.airStatus = 'Upcoming';
    } else if (previousEp && ep.episodeNumber < previousEp.episodeNumber) {
      updated.airStatus = 'Aired';
    } else if (previousEp && ep.episodeNumber > previousEp.episodeNumber) {
      updated.airStatus = 'Upcoming';
    }

    // Move air dates to match the status, since clients also work status out from them
    const runtime = updated.runtime * MINUTE;
    const time = updated.airDate.getTime();
    if (updated.airStatus === 'Airing') {
      updated.airDate = new Date(now - 10 * MINUTE);
    } else if (updated.airStatus === 'Aired' && time + runtime > now) {
      const weeksBack = previousEp ? previousEp.episodeNumber - ep.episodeNumber : 0;
      updated.airDate = new Date(now - runtime - 10 * MINUTE - weeksBack * WEEK);
    } else if (updated.airStatus === 'Upcoming' && time <= now) {
      const weeksAhead = nextEp ? ep.episodeNumber - nextEp.episodeNumber : 0;
      updated.airDate = new Date(now + 60 * MINUTE + weeksAhead * WEEK);
    }

    // Only one merge episode
    updated.isMerge = mergeEp ? ep.episodeId === mergeEp.episodeId : false;
    if (updated.isMerge) updated.isFinale = false;

    return updated;
  });
}

export const devHarness = {
  /** Pass a season's real episodes through the harness */
  async episodes(seasonId: number, episodes: Episode[]): Promise<Episode[]> {
    if (!isDevHarnessEnabled) return episodes;
    const config = await getActiveOverride();
    if (config?.seasonId !== seasonId) return episodes;
    return overrideEpisodes(config, episodes);
  },

  /** Pass a league (or league auth) through the harness */
  async league<T extends { seasonId: number; status: LeagueStatus; startWeek?: number | null }>(league: T): Promise<T> {
    if (!isDevHarnessEnabled) return league;
    const config = await getActiveOverride();
    if (config?.seasonId !== league.seasonId) return league;
    return {
      ...league,
      status: config.leagueStatus,
      ...('startWeek' in league ? { startWeek: config.startWeek } : {}),
    };
  },
};
