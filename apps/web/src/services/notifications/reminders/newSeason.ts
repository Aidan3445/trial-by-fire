import 'server-only';

import { and, eq, isNotNull, or } from 'drizzle-orm';
import { db } from '~/server/db';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import { sendPushToUser, sendPushToUsers } from '~/services/notifications/push';
import getAllSeasons from '~/services/seasons/query/allSeasons';
import { castAddedAt } from '~/services/seasons/query/castReady';

// Every other week, counted from the first daily run after the cast was added
const INTERVAL_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;
// When the daily season cron runs (see scripts/setupSeasonCron.ts)
const CRON_HOUR_UTC = 16;

const utcDay = (date: Date) => Math.floor(date.getTime() / DAY_MS);
// The UTC day of the first daily run at or after this time
const firstRunDay = (date: Date) => utcDay(date) + (date.getUTCHours() >= CRON_HOUR_UTC ? 1 : 0);

/**
  * Once the next season's cast is out, nudge last season's players every other
  * week until the premiere: owners to clone one of their leagues, everyone else
  * to create or join one. Skips anyone already in a league for the new season.
  * Meant to run from a daily cron; only sends on the right days.
  * @returnObj `{ sent, reason? }`
  */
export async function sendNewSeasonNotifications(now = new Date()) {
  // Newest first; the cache can hand dates back as strings
  const seasons = await getAllSeasons();
  const upcomingIndex = seasons.findLastIndex((season) => new Date(season.premiereDate) > now);
  const upcoming = seasons[upcomingIndex];
  const previous = seasons[upcomingIndex + 1];
  if (!upcoming || !previous) return { sent: 0, reason: 'No upcoming season' };

  const addedAt = await castAddedAt(upcoming.seasonId);
  if (!addedAt) return { sent: 0, reason: 'No cast yet' };
  const daysSinceFirstRun = utcDay(now) - firstRunDay(new Date(addedAt));
  if (daysSinceFirstRun < 0 || daysSinceFirstRun % INTERVAL_DAYS !== 0) {
    return { sent: 0, reason: 'Not a send day' };
  }

  const [players, alreadyIn] = await Promise.all([
    // Admitted members of last season's leagues that actually played
    db
      .select({
        userId: leagueMemberSchema.userId,
        role: leagueMemberSchema.role,
        leagueName: leagueSchema.name,
        leagueHash: leagueSchema.hash,
      })
      .from(leagueMemberSchema)
      .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
      .where(and(
        eq(leagueSchema.seasonId, previous.seasonId),
        isNotNull(leagueMemberSchema.draftOrder),
        or(
          eq(leagueSchema.status, 'Active'),
          and(eq(leagueSchema.status, 'Inactive'), eq(leagueSchema.neverDrafted, false))))),
    // Anyone in or waiting on a league for the new season already
    db
      .selectDistinct({ userId: leagueMemberSchema.userId })
      .from(leagueMemberSchema)
      .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
      .where(eq(leagueSchema.seasonId, upcoming.seasonId))
      .then((rows) => new Set(rows.map((row) => row.userId))),
  ]);

  // One message per user: the first league they own, or none
  const ownedLeague = new Map<string, { leagueName: string; leagueHash: string } | null>();
  for (const { userId, role, leagueName, leagueHash } of players) {
    if (alreadyIn.has(userId)) continue;
    if (role === 'Owner' && !ownedLeague.get(userId)) {
      ownedLeague.set(userId, { leagueName, leagueHash });
    } else if (!ownedLeague.has(userId)) {
      ownedLeague.set(userId, null);
    }
  }

  const title = `${upcoming.name} is coming!`;
  const memberIds = [...ownedLeague].filter(([, league]) => !league).map(([userId]) => userId);
  const owners = [...ownedLeague].filter(([, league]) => league) as [string, { leagueName: string; leagueHash: string }][];

  const results = await Promise.allSettled([
    sendPushToUsers(memberIds, {
      title,
      body: 'Create or join a league for the new season.',
      data: { type: 'new_season' },
      collapseId: `new-season-${upcoming.seasonId}`,
    }, 'reminders'),
    ...owners.map(([userId, { leagueName, leagueHash }]) => sendPushToUser(userId, {
      title,
      body: `Run back ${leagueName} for the new season?`,
      data: { type: 'new_season_clone', leagueHash },
      collapseId: `new-season-${upcoming.seasonId}`,
    }, 'reminders')),
  ]);
  results
    .filter((result) => result.status === 'rejected')
    .forEach((result) => console.error('Failed to send new season notification', result.reason));

  console.log(`New season: notified ${owners.length} owners and ${memberIds.length} members for ${upcoming.name}`);
  return { sent: owners.length + memberIds.length };
}
