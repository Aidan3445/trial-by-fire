import 'server-only';

import { createTable } from '~/server/db/schema/createTable';
import { seasonSchema } from '~/server/db/schema/seasons';
import { baseEventSchema } from '~/server/db/schema/baseEvents';
import { integer, serial, unique, varchar } from 'drizzle-orm/pg-core';

export const tribeSchema = createTable(
  'tribe',
  {
    tribeId: serial('tribe_id').notNull().primaryKey(),
    tribeName: varchar('name', { length: 16 }).notNull(),
    tribeColor: varchar('color', { length: 7 }).notNull(),
    // null seasonId for production or anything else to be shared across seasons
    seasonId: integer('season_id').references(() => seasonSchema.seasonId, { onDelete: 'cascade' }),
    // The tribe update event that created this tribe, if it was made with one, so that event can rename it
    createdByEventId: integer('created_by_event_id').references(() => baseEventSchema.baseEventId, { onDelete: 'set null' }),
  },
  (table) => ([
    unique('tribe_name_season_unq').on(table.tribeName, table.seasonId)
  ])
);

