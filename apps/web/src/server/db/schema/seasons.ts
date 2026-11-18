import 'server-only';

import { createTable } from '~/server/db/schema/createTable';
import { serial, timestamp, varchar } from 'drizzle-orm/pg-core';

export const seasonSchema = createTable(
  'season',
  {
    seasonId: serial('season_id').notNull().primaryKey(),
    name: varchar('season_name', { length: 64 }).notNull().unique(),
    // Announced premiere; once episode 1 exists its air date wins (see seasonDates)
    premiereDate: timestamp('premier_date', { mode: 'string' }).notNull(),
  }
);


