import events from './events.json';
import leagues from './leagues.json';
import notifications from './notifications.json';
import tutorial from './tutorial.json';
import general from './general.json';
import seasons from './seasons.json';
import predictions from './predictions.json';

export const copy = {
  events,
  leagues,
  notifications,
  tutorial,
  general,
  seasons,
  predictions,
} as const;

export type Copy = typeof copy;

export { events, leagues, notifications, tutorial, general, seasons, predictions };
