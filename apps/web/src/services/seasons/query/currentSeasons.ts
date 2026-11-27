import 'server-only';

import { db } from '~/server/db';
import { asc, ne } from 'drizzle-orm';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type Season } from '~/types/seasons';
import { unstable_cache } from 'next/cache';
import {
  parseSeasonDate, seasonColumns, seasonFinaleEnd, seasonHasCast, seasonPremiere, toSeason,
} from '~/services/seasons/query/seasonDates';

/**
  * Get the current seasons
  * @returns The current seasons
  * @returObj `Season[]`
  */
export default async function getCurrentSeasons() {
  return unstable_cache(
    async () => fetchCurrentSeasons(),
    ['current-seasons'],
    {
      revalidate: 3600, // 1 hour
      tags: ['seasons', 'current-seasons']
    }
  )();
}

/**
  * A season is current while it has a cast and either its finale hasn't
  * finished, or it's the newest season with a cast. So the season that just
  * ended stays current (through the finale and the offseason) until the next
  * season's cast is added, and seasons with no cast are never current.
  */
async function fetchCurrentSeasons(): Promise<Season[]> {
  const now = Date.now();
  const seasons = await db
    .select({ ...seasonColumns, finaleEnd: seasonFinaleEnd, hasCast: seasonHasCast })
    .from(seasonSchema)
    .where(ne(seasonSchema.seasonId, process.env.NODE_ENV === 'production' ? -1 : 0))
    .orderBy(asc(seasonPremiere));

  const withCast = seasons.filter((season) => season.hasCast);
  const newestWithCast = withCast.at(-1);
  return withCast
    .filter((season) => season === newestWithCast
      || !season.finaleEnd
      || parseSeasonDate(season.finaleEnd).getTime() > now)
    .map(({ finaleEnd: _finaleEnd, hasCast: _hasCast, ...season }): Season => toSeason(season));
}
