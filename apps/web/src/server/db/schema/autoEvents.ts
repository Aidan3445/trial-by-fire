import 'server-only';

import { boolean, index, integer, jsonb, pgEnum, real, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { createTable } from '~/server/db/schema/createTable';
import { episodeSchema } from '~/server/db/schema/episodes';
import { baseEventSchema, eventName } from '~/server/db/schema/baseEvents';
import { label, notes } from '~/server/db/schema/shared';
import { EventCheckStatuses, AutoEventStatuses, type AutoEventAsk, type EventReference } from '~/types/events';

export const eventCheckStatus = pgEnum('event_check_status', EventCheckStatuses);
export const autoEventStatus = pgEnum('auto_event_status', AutoEventStatuses);

/**
 * One scene a caption detector checked with Jev. Detectors claim a check
 * before asking Jev so a scene several of them see is only asked once.
 */
export const eventCheckSchema = createTable(
  'event_check',
  {
    checkId: serial('event_check_id').notNull().primaryKey(),
    episodeId: integer('episode_id').references(() => episodeSchema.episodeId, { onDelete: 'cascade' }).notNull(),
    segment: varchar('segment', { length: 32 }).notNull(),
    questionSetVersion: varchar('question_set_version', { length: 64 }).notNull(),
    status: eventCheckStatus('status').notNull().default('running'),
    /** Source currently asking Jev, or that did */
    claimedBy: varchar('claimed_by', { length: 64 }).notNull(),
    sources: varchar('sources', { length: 64 }).array().notNull(),
    detections: integer('detections').notNull().default(1),
    /** Jev's confidence the scene happened */
    detected: real('detected'),
    trigger: varchar('trigger', { length: 256 }),
    airedStart: real('aired_start'),
    airedEnd: real('aired_end'),
    fingerprint: jsonb('fingerprint').$type<string[]>().notNull(),
    error: varchar('error', { length: 512 }),
  },
  (table) => [
    index('event_check_episode_segment_idx').on(table.episodeId, table.segment),
  ]
);

/** An event a check found, waiting for an admin to accept or deny it. */
export const autoEventSchema = createTable(
  'auto_event',
  {
    autoEventId: serial('auto_event_id').notNull().primaryKey(),
    checkId: integer('event_check_id').references(() => eventCheckSchema.checkId, { onDelete: 'cascade' }).notNull(),
    episodeId: integer('episode_id').references(() => episodeSchema.episodeId, { onDelete: 'cascade' }).notNull(),
    eventName: eventName('name').notNull(),
    subtype: label('subtype'),
    references: jsonb('references').$type<EventReference[]>().notNull(),
    unmatched: varchar('unmatched', { length: 64 }).array().notNull(),
    notes: notes('notes'),
    confidence: real('confidence'),
    asks: jsonb('asks').$type<AutoEventAsk[]>().notNull(),
    detections: integer('detections').notNull().default(1),
    status: autoEventStatus('status').notNull().default('pending'),
    viewedAt: timestamp('viewed_at', { mode: 'date', withTimezone: true }),
    handledBy: varchar('handled_by', { length: 64 }),
    handledAt: timestamp('handled_at', { mode: 'date', withTimezone: true }),
    used: boolean('used').notNull().default(false),
    baseEventId: integer('event_base_id').references(() => baseEventSchema.baseEventId, { onDelete: 'set null' }),
  },
  (table) => [
    index('auto_event_episode_idx').on(table.episodeId),
    index('auto_event_check_idx').on(table.checkId),
  ]
);
