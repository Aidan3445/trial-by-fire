import 'server-only';

import { getTableName, sql } from 'drizzle-orm';
import { castawaySchema } from '~/server/db/schema/castaways';
import { episodeSchema } from '~/server/db/schema/episodes';
import { seasonSchema } from '~/server/db/schema/seasons';

/*
 * Season dates come from the episodes, so there's nothing to keep in sync.
 * Both are UTC timestamps as text ('YYYY-MM-DD HH:MI:SS'); parse with
 * `parseSeasonDate`.
 */

// Written with explicit identifiers: in a select from one table, drizzle drops
// table names from columns inside sql expressions, which would turn the
// correlation below into "season_id" = "season_id" and match every season.
const ep = sql.identifier('premiere_or_finale_ep');
const epColumn = (column: { name: string }) => sql`${ep}.${sql.identifier(column.name)}`;
const outerSeasonId = sql`${sql.identifier(getTableName(seasonSchema))}.${sql.identifier(seasonSchema.seasonId.name)}`;

// The premiere episode's air date, or the announced date before episodes exist
export const seasonPremiere = sql<string>`COALESCE(
  (SELECT ${epColumn(episodeSchema.airDate)} FROM ${episodeSchema} AS ${ep}
    WHERE ${epColumn(episodeSchema.seasonId)} = ${outerSeasonId} AND ${epColumn(episodeSchema.episodeNumber)} = 1
    LIMIT 1),
  ${sql.identifier(getTableName(seasonSchema))}.${sql.identifier(seasonSchema.premiereDate.name)})::text`;

// The finale episode's air date, null until the finale is imported
export const seasonFinale = sql<string | null>`(SELECT ${epColumn(episodeSchema.airDate)} FROM ${episodeSchema} AS ${ep}
  WHERE ${epColumn(episodeSchema.seasonId)} = ${outerSeasonId} AND ${epColumn(episodeSchema.isFinale)}
  ORDER BY ${epColumn(episodeSchema.airDate)} DESC LIMIT 1)::text`;

// When the finale finishes airing, null until the finale is imported
export const seasonFinaleEnd = sql<string | null>`(SELECT ${epColumn(episodeSchema.airDate)} + ${epColumn(episodeSchema.runtime)} * interval '1 minute'
  FROM ${episodeSchema} AS ${ep}
  WHERE ${epColumn(episodeSchema.seasonId)} = ${outerSeasonId} AND ${epColumn(episodeSchema.isFinale)}
  ORDER BY ${epColumn(episodeSchema.airDate)} DESC LIMIT 1)::text`;

// Whether the season's cast has been added
const cast = sql.identifier('season_cast');
export const seasonHasCast = sql<boolean>`EXISTS (SELECT 1 FROM ${castawaySchema} AS ${cast}
  WHERE ${cast}.${sql.identifier(castawaySchema.seasonId.name)} = ${outerSeasonId})`;

// Select these for a `Season`
export const seasonColumns = {
  seasonId: seasonSchema.seasonId,
  name: seasonSchema.name,
  premiereDate: seasonPremiere,
  finaleDate: seasonFinale,
};

export const parseSeasonDate = (date: string) => new Date(`${date} Z`);

/** Turn a row selected with `seasonColumns` into a `Season` */
export const toSeason = (row: { seasonId: number; name: string; premiereDate: string; finaleDate: string | null }) => ({
  ...row,
  premiereDate: parseSeasonDate(row.premiereDate),
  finaleDate: row.finaleDate ? parseSeasonDate(row.finaleDate) : null,
});
