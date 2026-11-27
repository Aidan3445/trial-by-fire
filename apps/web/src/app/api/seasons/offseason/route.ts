import { NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import getOffseasonStatus from '~/services/seasons/query/offseason';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withAuth(async (userId) => {
    try {
      const status = await getOffseasonStatus(userId);
      return NextResponse.json(status, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      console.error('Failed to get offseason status', e);
      return NextResponse.json({ error: 'An error occurred while fetching the season status.' }, { status: 500 });
    }
  })();
}
