import { type NextRequest, NextResponse } from 'next/server';
import { withAuth } from '~/lib/apiMiddleware';
import updateSurveyLogic from '~/services/survey/mutation/updateSurvey';
import getSurvey from '~/services/survey/query/survey';
import { SurveyUpdateZod } from '~/types/survey';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return withAuth(async (userId) => {
    const seasonId = Number(request.nextUrl.searchParams.get('seasonId'));
    if (!Number.isInteger(seasonId)) {
      return NextResponse.json({ error: 'Missing or invalid seasonId parameter' }, { status: 400 });
    }
    try {
      const survey = await getSurvey(userId, seasonId);
      return NextResponse.json({ survey }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
    } catch (e) {
      console.error('Failed to get survey', e);
      return NextResponse.json({ error: 'An error occurred while fetching the survey.' }, { status: 500 });
    }
  })();
}

// Save answers as they're picked; with only a seasonId, marks the survey as shown
export async function PUT(request: NextRequest) {
  return withAuth(async (userId) => {
    const parsed = SurveyUpdateZod.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Invalid survey answers' }, { status: 400 });
    }
    try {
      const result = await updateSurveyLogic(userId, parsed.data);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      console.error('Failed to save survey', e);
      return NextResponse.json({ error: 'An error occurred while saving the survey.' }, { status: 500 });
    }
  })();
}
