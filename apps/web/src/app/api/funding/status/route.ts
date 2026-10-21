import { NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import getDonationStatus from '~/services/funding/query/donationStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withAuth(async (userId) => {
    try {
      const status = await getDonationStatus(userId);
      return NextResponse.json(status, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      console.error('Failed to get donation status', e);
      return NextResponse.json({ error: 'An error occurred while fetching donation status.' }, { status: 500 });
    }
  })();
}
