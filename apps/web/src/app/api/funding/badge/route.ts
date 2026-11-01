import { type NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { withAuth } from '~/lib/apiMiddleware';
import setBadgeHidden from '~/services/funding/mutation/hideBadge';

export const dynamic = 'force-dynamic';

const BadgeZod = z.object({ hidden: z.boolean() });

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = BadgeZod.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

    try {
      await setBadgeHidden(userId, parsed.data.hidden);
      return NextResponse.json({ hidden: parsed.data.hidden }, { status: 200 });
    } catch (e) {
      console.error('Failed to update donor crown', e);
      return NextResponse.json({ error: 'An error occurred while saving.' }, { status: 500 });
    }
  })();
}
