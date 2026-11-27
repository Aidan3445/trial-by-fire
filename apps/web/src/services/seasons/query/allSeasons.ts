import 'server-only';

import { db } from '~/server/db';
import { desc, ne } from 'drizzle-orm';
import { seasonSchema } from '~/server/db/schema/seasons';
import { type Season } from '~/types/seasons';
import { unstable_cache } from 'next/cache';
import { seasonColumns, seasonPremiere, toSeason } from '~/services/seasons/query/seasonDates';

/**
  * Get all seasons
  * @returns All seasons
  * @returObj `Season[]`
  */
export default async function getAllSeasons() {
  return unstable_cache(
    async () => fetchAllSeasons(),
    ['all-seasons'],
    {
      revalidate: 3600, // 1 hour
      tags: ['seasons', 'all-seasons']
    }
  )();
}

async function fetchAllSeasons() {
  return db
    .select(seasonColumns)
    .from(seasonSchema)
    .where(ne(seasonSchema.seasonId, process.env.NODE_ENV === 'production' ? -1 : 0))
    .orderBy(desc(seasonPremiere))
    .then(rows => rows.map((row): Season => toSeason(row)));
}
