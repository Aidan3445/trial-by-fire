import { type NextRequest, NextResponse } from 'next/server';
import { withDetectorAuth } from '~/lib/apiMiddleware';
import { DetectorCheckClaimZod } from '~/lib/detector';
import claimCheckLogic from '~/services/autoEvents/mutation/claimCheck';

export async function POST(req: NextRequest) {
  return withDetectorAuth(async () => {
    const parsed = DetectorCheckClaimZod.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid check', issues: parsed.error.issues }, { status: 400 });
    }

    try {
      const result = await claimCheckLogic(parsed.data);
      return NextResponse.json(result, { status: result.status === 'claimed' ? 201 : 200 });
    } catch (e) {
      console.error('Failed to claim check', e);
      return NextResponse.json({ error: 'An error occurred while claiming the check.' }, { status: 500 });
    }
  })(req);
}
