import 'server-only';

import { boolean, index, integer, numeric, serial, varchar } from 'drizzle-orm/pg-core';
import { createTable } from '~/server/db/schema/createTable';
import { seasonSchema } from '~/server/db/schema/seasons';

const dollars = (name: string) => numeric(name, { precision: 10, scale: 2 });

// A running cost donations go toward. Edit goal and coverage by hand as needed.
export const fundingSchema = createTable(
  'funding',
  {
    fundingId: serial('funding_id').notNull().primaryKey(),
    name: varchar('name', { length: 64 }).notNull(),
    description: varchar('description', { length: 512 }).notNull(),
    goal: dollars('goal').notNull(),
    coverage: dollars('coverage').notNull().default('0'),
    // Lower comes first
    priority: integer('priority').notNull().default(0),
  }
);

// Donations from the Buy Me a Coffee webhook, plus older ones users reported themselves
export const fundingDonationSchema = createTable(
  'funding_donation',
  {
    donationId: serial('funding_donation_id').notNull().primaryKey(),
    // To be deprecated in favor of bmac webhook 
    userId: varchar('user_id', { length: 64 }),
    email: varchar('email', { length: 320 }),
    fundingId: integer('funding_id').references(() => fundingSchema.fundingId, { onDelete: 'set null' }),
    seasonId: integer('season_id').references(() => seasonSchema.seasonId, { onDelete: 'set null' }),
    amount: dollars('amount').notNull(),
    // Null if userId is not 
    bmacId: varchar('bmac_id', { length: 64 }).unique(),
    refunded: boolean('refunded').notNull().default(false),
    thanked: boolean('thanked').notNull().default(false),
  },
  (table) => [
    index('funding_donation_user_idx').on(table.userId),
    index('funding_donation_email_idx').on(table.email),
  ]
);

// Users who said don't ask again, until a later season is active for them 
export const fundingOptOutSchema = createTable(
  'funding_opt_out',
  {
    userId: varchar('user_id', { length: 64 }).notNull().primaryKey(),
    seasonId: integer('season_id').notNull().references(() => seasonSchema.seasonId, { onDelete: 'cascade' }),
  }
);
