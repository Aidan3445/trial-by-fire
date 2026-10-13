import { type NextRequest, NextResponse } from 'next/server';
import { withDetectorAuth } from '~/lib/apiMiddleware';
import getDetectorContext from '~/services/autoEvents/query/detectorContext';

const optionalId = (value: string | null) => {
  const id = value ? parseInt(value, 10) : NaN;
  return Number.isInteger(id) && id > 0 ? id : null;
};

export async function GET(req: NextRequest) {
  return withDetectorAuth(async () => {
    const seasonId = optionalId(req.nextUrl.searchParams.get('seasonId'));
    const episode = optionalId(req.nextUrl.searchParams.get('episode'));

    try {
      const context = await getDetectorContext(seasonId, episode);
      if (!context) {
        return NextResponse.json({ error: 'No matching season or episode' }, { status: 404 });
      }
      return NextResponse.json(context, { status: 200 });
    } catch (e) {
      console.error('Failed to get detector context', e);
      return NextResponse.json({ error: 'An error occurred while fetching the detector context.' }, { status: 500 });
    }
  })(req);
}
