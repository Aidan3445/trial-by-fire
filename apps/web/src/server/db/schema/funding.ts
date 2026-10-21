import 'server-only';

import { index, integer, numeric, serial, varchar } from 'drizzle-orm/pg-core';
import { createTable } from '~/server/db/schema/createTable';
import { seasonSchema } from '~/server/db/schema/seasons';

const dollars = (name: string) => numeric(name, { precision: 10, scale: 2 });

/** A running cost donations go toward. Edit goal and coverage by hand as needed. */
export const fundingSchema = createTable(
  'funding',
  {
    fundingId: serial('funding_id').notNull().primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 512 }).notNull(),
    goal: dollars('goal').notNull(),
    coverage: dollars('coverage').notNull().default('0'),
    /** Lower comes first */
    priority: integer('priority').notNull().default(0),
  }
);

/** What users said they donated, to check against Buy Me a Coffee */
export const fundingDonationSchema = createTable(
  'funding_donation',
  {
    donationId: serial('funding_donation_id').notNull().primaryKey(),
    userId: varchar('user_id', { length: 64 }).notNull(),
    fundingId: integer('funding_id').references(() => fundingSchema.fundingId, { onDelete: 'set null' }),
    seasonId: integer('season_id').references(() => seasonSchema.seasonId, { onDelete: 'set null' }),
    amount: dollars('amount').notNull(),
  },
  (table) => [
    index('funding_donation_user_idx').on(table.userId),
  ]
);
