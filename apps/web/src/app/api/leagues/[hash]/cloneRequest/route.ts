import { type NextRequest, NextResponse } from 'next/server';
import type { LeagueRouteParams } from '~/types/api';
import { withLeagueMemberAuth } from '~/lib/apiMiddleware';
import requestCloneLogic from '~/services/leagues/mutation/requestClone';

// Ask the owner to clone the league for the new season
export async function POST(_: NextRequest, context: LeagueRouteParams) {
  return withLeagueMemberAuth(async (auth) => {
    try {
      const result = await requestCloneLogic(auth);
      return NextResponse.json(result, { status: 200 });
    } catch (e) {
      console.error('Failed to request a clone', e);
      return NextResponse.json({ error: 'Could not send the request right now.' }, { status: 400 });
    }
  })(context);
}
