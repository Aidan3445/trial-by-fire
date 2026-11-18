import { NextResponse } from 'next/server';
import { getAppVersionInfo } from '~/lib/appVersion';

export const dynamic = 'force-dynamic';

// Public: the app checks this before sign in, too
export function GET() {
  return NextResponse.json(getAppVersionInfo(), { status: 200, headers: { 'Cache-Control': 'no-store' } });
}
