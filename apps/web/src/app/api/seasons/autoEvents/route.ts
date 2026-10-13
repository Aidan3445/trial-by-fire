import { type NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { withSystemAdminAuth } from '~/lib/apiMiddleware';
import getAutoEvents from '~/services/autoEvents/query/autoEvents';
import updateAutoEventsLogic, { AutoEventActions } from '~/services/autoEvents/mutation/updateAutoEvents';

export async function GET(req: NextRequest) {
  return withSystemAdminAuth(async () => {
    const seasonIdParam = req.nextUrl.searchParams.get('seasonId');
    const seasonId = seasonIdParam ? parseInt(seasonIdParam, 10) : undefined;

    if (!seasonId) {
      return NextResponse.json({ error: 'Missing or invalid seasonId parameter' }, { status: 400 });
    }

    try {
      const autoEvents = await getAutoEvents(seasonId);
      return NextResponse.json(autoEvents, { status: 200 });
    } catch (e) {
      console.error('Failed to get auto events', e);
      return NextResponse.json({ error: 'An error occurred while fetching auto events.' }, { status: 500 });
    }
  })();
}

const AutoEventUpdateZod = z.object({
  seasonId: z.number().int().positive(),
  autoEventIds: z.number().int().positive().array().max(500),
  action: z.enum(AutoEventActions),
});

export async function PATCH(req: NextRequest) {
  return withSystemAdminAuth(async (userId) => {
    const parsed = AutoEventUpdateZod.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid auto event update' }, { status: 400 });
    }

    try {
      const { seasonId, autoEventIds, action } = parsed.data;
      const changed = await updateAutoEventsLogic(seasonId, autoEventIds, action, userId);
      return NextResponse.json({ changed }, { status: 200 });
    } catch (e) {
      console.error('Failed to update auto events', e);
      return NextResponse.json({ error: 'An error occurred while updating auto events.' }, { status: 500 });
    }
  })();
}
