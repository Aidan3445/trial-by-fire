import { createHmac, timingSafeEqual } from 'crypto';
import { type NextRequest, NextResponse } from 'next/server';
import { type BmacDonation, recordBmacDonation, refundBmacDonation } from '~/services/funding/mutation/bmacDonation';

export const dynamic = 'force-dynamic';

type BmacEvent = {
  type: string;
  live_mode: boolean;
  data: BmacDonation;
};

// Buy Me a Coffee signs the raw body with the webhook's secret (BMAC_API_KEY)
function verifySignature(body: string, signature: string | null) {
  const secret = process.env.BMAC_API_KEY;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(body).digest();
  const given = Buffer.from(signature, 'hex');
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
  * Buy Me a Coffee webhook: counts donations toward funding goals and takes back refunds,
  * so donors don't have to report them.
  */
export async function POST(req: NextRequest) {
  const body = await req.text();
  if (!verifySignature(body, req.headers.get('x-signature-sha256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: BmacEvent;
  try {
    event = JSON.parse(body) as BmacEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  }

  // Test events from the dashboard aren't real money
  if (!event.live_mode) {
    console.log('Buy Me a Coffee test event', event.type);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  try {
    switch (event.type) {
      case 'donation.created':
        await recordBmacDonation(event.data);
        break;
      case 'donation.refunded':
        await refundBmacDonation(event.data);
        break;
      default:
        break;
    }
    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    // Non-2xx so Buy Me a Coffee retries
    console.error('Failed to handle Buy Me a Coffee webhook', event.type, e);
    return NextResponse.json({ error: 'An error occurred while handling the webhook.' }, { status: 500 });
  }
}
