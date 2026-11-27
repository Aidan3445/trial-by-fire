import 'server-only';

import { and, eq, exists, gt, inArray, isNotNull, lte, not, sql, type SQL } from 'drizzle-orm';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { leagueMemberSchema } from '~/server/db/schema/leagueMembers';
import { leagueSchema } from '~/server/db/schema/leagues';
import { liveScoringSessionSchema, pushTokens } from '~/server/db/schema/notifications';
import { sendPushMessages } from '~/services/notifications/push';
import getCurrentSeasons from '~/services/seasons/query/currentSeasons';
import {
  type ManualPush, type ManualPushFilters, type ManualPushResult,
  ManualPushRoleMemberships, ManualPushSeasonMemberships,
} from '~/types/manualPush';

/**
  * A user's league memberships, narrowed by the conditions given. Joins the league
  * so the user id stays qualified as the outer push token's.
  * @param conditions Extra conditions on the membership or league
  */
function membership(...conditions: (SQL | undefined)[]) {
  return db
    .select({ one: sql`1` })
    .from(leagueMemberSchema)
    .innerJoin(leagueSchema, eq(leagueSchema.leagueId, leagueMemberSchema.leagueId))
    .where(and(eq(leagueMemberSchema.userId, pushTokens.userId), ...conditions));
}

/**
  * The devices a manual push would go to, after every filter
  * @param filters Who to send to
  * @returns each device's token and user
  */
export async function findManualPushTokens(filters: ManualPushFilters) {
  const { membership: audience, roles, liveOptIn, platforms, preference } = filters;

  let seasonId = filters.seasonId;
  if (seasonId === null && ManualPushSeasonMemberships.includes(audience)) {
    seasonId = (await getCurrentSeasons()).at(-1)?.seasonId ?? null;
    if (seasonId === null) return [];
  }

  // Admitted members only, so people waiting on approval don't count as in a league
  const admitted = isNotNull(leagueMemberSchema.draftOrder);
  const roleFilter = roles.length > 0 && ManualPushRoleMemberships.includes(audience)
    ? inArray(leagueMemberSchema.role, roles)
    : undefined;

  const membershipFilter = (() => {
    switch (audience) {
      case 'activeLeague':
        return exists(membership(admitted, eq(leagueSchema.status, 'Active'), roleFilter));
      case 'inSeason':
        return exists(membership(admitted, eq(leagueSchema.seasonId, seasonId!), roleFilter));
      case 'notInSeason':
        // Pending requests count as in, since they're already on their way
        return not(exists(membership(eq(leagueSchema.seasonId, seasonId!))));
      case 'noLeagues':
        return not(exists(membership()));
      default:
        return undefined;
    }
  })();

  // Opted into live scoring for an episode that's airing right now
  const now = new Date().toISOString();
  const liveFilter = liveOptIn
    ? exists(db
      .select({ one: sql`1` })
      .from(liveScoringSessionSchema)
      .innerJoin(episodeSchema, eq(episodeSchema.episodeId, liveScoringSessionSchema.episodeId))
      .where(and(
        eq(liveScoringSessionSchema.userId, pushTokens.userId),
        lte(episodeSchema.airDate, now),
        gt(sql`${episodeSchema.airDate} + ${episodeSchema.runtime} * interval '1 minute'`, now))))
    : undefined;

  return db
    .select({ token: pushTokens.token, userId: pushTokens.userId })
    .from(pushTokens)
    .where(and(
      eq(pushTokens.enabled, true),
      platforms.length > 0 ? inArray(pushTokens.platform, platforms) : undefined,
      preference ? sql`(${pushTokens.preferences} ->> ${preference})::boolean IS TRUE` : undefined,
      membershipFilter,
      liveFilter,
    ));
}

/**
  * Count, or send, a push written by a sys admin
  * @param push The filters and message; dryRun only counts
  * @returnObj `ManualPushResult`
  */
export default async function manualPushLogic(push: ManualPush): Promise<ManualPushResult> {
  const devices = await findManualPushTokens(push.filters);
  const users = new Set(devices.map((device) => device.userId)).size;
  if (push.dryRun || devices.length === 0) return { users, devices: devices.length, sent: false };

  await sendPushMessages(devices.map((device) => device.token), {
    title: push.title,
    body: push.body,
    data: { type: 'manual' },
  });
  console.log(`Manual push sent to ${users} users on ${devices.length} devices`, push.filters);
  return { users, devices: devices.length, sent: true };
}
