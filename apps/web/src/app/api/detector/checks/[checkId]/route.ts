import { type NextRequest, NextResponse } from 'next/server';
import { withDetectorAuth } from '~/lib/apiMiddleware';
import { DetectorCheckResultZod } from '~/lib/detector';
import completeCheckLogic from '~/services/autoEvents/mutation/completeCheck';

export async function POST(req: NextRequest, { params }: { params: Promise<{ checkId: string }> }) {
  return withDetectorAuth(async () => {
    const checkId = parseInt((await params).checkId, 10);
    if (!Number.isInteger(checkId)) {
      return NextResponse.json({ error: 'Invalid checkId' }, { status: 400 });
    }
    const parsed = DetectorCheckResultZod.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid check result', issues: parsed.error.issues }, { status: 400 });
    }

    try {
      const result = await completeCheckLogic(checkId, parsed.data);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      console.error('Failed to complete check', e);
      const notFound = e instanceof Error && e.message.includes('not found');
      return NextResponse.json(
        { error: notFound ? 'Check not found' : 'An error occurred while saving the check result.' },
        { status: notFound ? 404 : 500 });
    }
  })(req);
}
