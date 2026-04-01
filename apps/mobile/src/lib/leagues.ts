export * from '@survivor/lib';
// Re-exports from @survivor/lib: LeagueStatuses, LeagueMemberRoles, ShauhinModeTimings,
// MAX_SEASON_LENGTH, LEAGUE_NAME_MIN_LENGTH, LEAGUE_NAME_MAX_LENGTH, DEFAULT_SURVIVAL_CAP,
// DISPLAY_NAME_MIN_LENGTH, DISPLAY_NAME_MAX_LENGTH, ABS_MAX_EVENT_POINTS,
// SHAUHIN_MODE_MAX_MAX_BETS_PER_WEEK, DEFAULT_SECONDARY_PICK_*, DEFAULT_SHOT_IN_THE_DARK_ENABLED,
// defaultBaseRules, defaultNewCustomRule, defaultBasePredictionRules, defaultShauhinModeSettings,
// defaultSecondaryPickSettings

// Mobile-only exports below:

export const MAX_LEAGUE_MEMBERS_HOME_DISPLAY = 5;

export function displayNameRemap(name: string) {
  switch (name) {
    case 'Aidan+Minnow':
      return 'Aidan';
    case 'molly':
      return 'Molly';
    case 'emma':
      return 'Emma';
    case 'jeffy':
      return 'Jeffy';
    case 'robyn-will':
      return 'Robyn-Will';
    case 'Jason & Iris \u{1F3C6}':
      return 'Jason & Iris';
    case 'shulie':
      return 'Shulie';
    default:
      return name;
  }
}
