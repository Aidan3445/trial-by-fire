import { type NextRequest, NextResponse } from 'next/server';
import { withSystemAdminAuth } from '~/lib/apiMiddleware';
import manualPushLogic from '~/services/notifications/manualPush';
import { ManualPushZod } from '~/types/manualPush';

export const dynamic = 'force-dynamic';

// Count (dryRun) or send a push written by a sys admin, to everyone or a filtered audience
export async function POST(request: NextRequest) {
  return withSystemAdminAuth(async () => {
    const parsed = ManualPushZod.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid push' }, { status: 400 });
    }
    try {
      const result = await manualPushLogic(parsed.data);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      console.error('Failed to send manual push', e);
      return NextResponse.json({ error: 'An error occurred while sending the push.' }, { status: 500 });
    }
  })();
}
