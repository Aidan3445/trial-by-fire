import { NextResponse } from 'next/server';
import getFunding from '~/services/funding/query/funding';

// Edits to the funding table should show on the next load
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const funding = await getFunding();
    return NextResponse.json(funding, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  } catch (e) {
    console.error('Failed to get funding', e);
    return NextResponse.json({ error: 'An error occurred while fetching funding.' }, { status: 500 });
  }
}
