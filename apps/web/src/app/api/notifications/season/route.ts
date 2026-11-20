import { NextResponse } from 'next/server';
import endFinishedSeasons from '~/services/seasons/mutation/endSeason';
import { sendNewSeasonNotifications } from '~/services/notifications/reminders/newSeason';

/**
  * Daily: end any season whose finale finished (a backstop for the finale's
  * episode finished job), then send new season notifications when they're due
  */
export async function POST(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.QSTASH_CRON_SECRET_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [ended, newSeason] = await Promise.allSettled([endFinishedSeasons(), sendNewSeasonNotifications()]);
  if (ended.status === 'rejected') console.error('Failed to end finished seasons', ended.reason);
  if (newSeason.status === 'rejected') console.error('Failed to send new season notifications', newSeason.reason);

  const body = {
    ended: ended.status === 'fulfilled' ? ended.value : null,
    newSeason: newSeason.status === 'fulfilled' ? newSeason.value : null,
  };
  const failed = ended.status === 'rejected' || newSeason.status === 'rejected';
  return NextResponse.json(body, { status: failed ? 500 : 200 });
}
