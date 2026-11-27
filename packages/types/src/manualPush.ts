import z from 'zod';
import { LeagueMemberRoles } from './leagueMembers';

export const MANUAL_PUSH_TITLE_MAX_LENGTH = 100;
export const MANUAL_PUSH_BODY_MAX_LENGTH = 500;

/**
  * Who to send to, by league membership:
  * - any: everyone with notifications on
  * - activeLeague: in a league that's playing right now
  * - inSeason: in a league for the chosen season
  * - notInSeason: not in any league for the chosen season
  * - noLeagues: not in any league at all
  */
export const ManualPushMemberships = ['any', 'activeLeague', 'inSeason', 'notInSeason', 'noLeagues'] as const;
export type ManualPushMembership = (typeof ManualPushMemberships)[number];
export const ManualPushMembershipLabels: Record<ManualPushMembership, string> = {
  any: 'Everyone',
  activeLeague: 'In an active league',
  inSeason: 'In a league for the season',
  notInSeason: 'No league for the season',
  noLeagues: 'In no leagues',
};
// Memberships that look at one season, and ones where member roles narrow it down
export const ManualPushSeasonMemberships: readonly ManualPushMembership[] = ['inSeason', 'notInSeason'];
export const ManualPushRoleMemberships: readonly ManualPushMembership[] = ['activeLeague', 'inSeason'];

export const PushPlatforms = ['ios', 'android'] as const;
export const PushPreferenceKeys = ['reminders', 'leagueActivity', 'episodeUpdates'] as const;
export type PushPreferenceKey = (typeof PushPreferenceKeys)[number];
export const PushPreferenceLabels: Record<PushPreferenceKey, string> = {
  reminders: 'Reminders',
  leagueActivity: 'League activity',
  episodeUpdates: 'Episode updates',
};

/** Every filter narrows the audience further */
export const ManualPushFiltersZod = z.object({
  membership: z.enum(ManualPushMemberships),
  // For inSeason / notInSeason; null means the newest current season
  seasonId: z.number().int().nullable(),
  // For activeLeague / inSeason; empty means any role
  roles: z.array(z.enum(LeagueMemberRoles)),
  // Opted into live scoring for the episode airing right now
  liveOptIn: z.boolean(),
  // Empty means every platform
  platforms: z.array(z.enum(PushPlatforms)),
  // Only devices with this notification setting on; null ignores settings
  preference: z.enum(PushPreferenceKeys).nullable(),
});
export type ManualPushFilters = z.infer<typeof ManualPushFiltersZod>;

export const DEFAULT_MANUAL_PUSH_FILTERS: ManualPushFilters = {
  membership: 'any',
  seasonId: null,
  roles: [],
  liveOptIn: false,
  platforms: [],
  preference: null,
};

export const ManualPushZod = z.object({
  filters: ManualPushFiltersZod,
  title: z.string().trim().max(MANUAL_PUSH_TITLE_MAX_LENGTH),
  body: z.string().trim().max(MANUAL_PUSH_BODY_MAX_LENGTH),
  // Count who would get it without sending
  dryRun: z.boolean(),
}).refine((push) => push.dryRun || (push.title !== '' && push.body !== ''), {
  message: 'A title and message are required to send',
});
export type ManualPush = z.infer<typeof ManualPushZod>;

export type ManualPushResult = {
  users: number;
  devices: number;
  sent: boolean;
};
