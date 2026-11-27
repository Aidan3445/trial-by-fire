import { Client } from '@upstash/qstash';

// Separate from setupCron.ts so running it doesn't duplicate the episode and draft schedules
console.log('Setting up daily season cron');
const qstash = new Client({ token: process.env.QSTASH_TOKEN! });

await qstash.schedules.create({
  scheduleId: 'season-daily', // fixed id, so running this again updates the schedule instead of adding another
  destination: 'https://trialbyfiresurvivor.com/api/notifications/season',
  // Keep in step with CRON_HOUR_UTC in services/notifications/reminders/newSeason.ts
  cron: '0 16 * * *', // daily at 16:00 UTC (11am ET), after the draft cron
  headers: { authorization: `Bearer ${process.env.QSTASH_CRON_SECRET_KEY}` },
});

console.log('Season cron schedule created or updated');
