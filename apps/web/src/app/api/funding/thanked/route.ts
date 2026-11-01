import { NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import { sessionEmail } from '~/lib/auth';
import thankDonations from '~/services/funding/mutation/thankDonations';

export const dynamic = 'force-dynamic';

export async function POST() {
  return withAuth(async () => {
    const email = await sessionEmail();
    if (!email) return NextResponse.json({ error: 'No email on your account' }, { status: 400 });

    try {
      await thankDonations(email);
      return NextResponse.json({ thanked: true }, { status: 200 });
    } catch (e) {
      console.error('Failed to mark donations thanked', e);
      return NextResponse.json({ error: 'An error occurred while saving.' }, { status: 500 });
    }
  })();
}
