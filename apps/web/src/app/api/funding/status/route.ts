import { NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import { sessionEmail } from '~/lib/auth';
import linkDonations from '~/services/funding/mutation/linkDonations';
import getDonationStatus from '~/services/funding/query/donationStatus';

export const dynamic = 'force-dynamic';

export async function GET() {
  return withAuth(async (userId) => {
    try {
      const email = await sessionEmail();
      // Claim their webhook donations so leaguemates see their crown
      if (email) await linkDonations(userId, email);
      const status = await getDonationStatus(userId, email);
      return NextResponse.json(status, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      console.error('Failed to get donation status', e);
      return NextResponse.json({ error: 'An error occurred while fetching donation status.' }, { status: 500 });
    }
  })();
}
