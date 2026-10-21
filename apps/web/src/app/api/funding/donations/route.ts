import { type NextRequest, NextResponse } from 'next/server';
import z from 'zod';
import { withAuth } from '~/lib/apiMiddleware';
import reportDonationLogic from '~/services/funding/mutation/reportDonation';

export const dynamic = 'force-dynamic';

const DonationReportZod = z.object({
  amount: z.number().positive().max(1000),
  fundingId: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = DonationReportZod.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Enter an amount between $0 and $1000' }, { status: 400 });
    }

    try {
      const funding = await reportDonationLogic(userId, parsed.data);
      return NextResponse.json(funding, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      console.error('Failed to report donation', e);
      return NextResponse.json({ error: 'An error occurred while saving your donation.' }, { status: 500 });
    }
  })();
}
