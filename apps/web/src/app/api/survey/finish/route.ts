import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '~/lib/apiMiddleware';
import finishSurveyLogic from '~/services/survey/mutation/finishSurvey';

export const dynamic = 'force-dynamic';

const FinishZod = z.object({ seasonId: z.number().int() });

// Close the survey; says whether to ask for a donation next
export async function POST(request: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = FinishZod.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: 'Missing or invalid seasonId' }, { status: 400 });
    }
    try {
      const result = await finishSurveyLogic(userId, parsed.data.seasonId);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      console.error('Failed to finish survey', e);
      return NextResponse.json({ error: 'An error occurred while saving the survey.' }, { status: 500 });
    }
  })();
}
