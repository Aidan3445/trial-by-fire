import { NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import optOutThisSeason from '~/services/funding/mutation/optOut';

export const dynamic = 'force-dynamic';

export async function POST() {
  return withAuth(async (userId) => {
    try {
      const optedOut = await optOutThisSeason(userId);
      return NextResponse.json({ optedOut }, { status: 200 });
    } catch (e) {
      console.error('Failed to opt out of donation asks', e);
      return NextResponse.json({ error: 'An error occurred while saving.' }, { status: 500 });
    }
  })();
}
