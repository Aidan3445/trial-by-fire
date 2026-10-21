import 'server-only';

import { eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { episodeSchema } from '~/server/db/schema/episodes';
import { eventCheckSchema, autoEventSchema } from '~/server/db/schema/autoEvents';
import getCastaways from '~/services/seasons/query/castaways';
import getTribes from '~/services/seasons/query/tribes';
import { revalidateAutoEvents } from '~/services/autoEvents/query/autoEvents';
import {
  type DetectorCheckResult,
  type DetectorCheckResultResponse,
  type DetectorAutoEventInput,
  type EventReference,
  type ReferenceType,
} from '~/types/events';

const MAX_NOTES = 10;
const MAX_NOTE_LENGTH = 256;

const normalize = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

/**
  * Map spoken names to ids. A castaway answers to their short name, full name,
  * or first name; a key two people share is dropped rather than guessed.
  */
async function nameResolver(seasonId: number) {
  const [castaways, tribes] = await Promise.all([getCastaways(seasonId), getTribes(seasonId)]);
  const keys: Record<ReferenceType, Map<string, number | null>> = { Castaway: new Map(), Tribe: new Map() };
  const add = (type: ReferenceType, name: string, id: number) => {
    const key = normalize(name);
    if (!key) return;
    const known = keys[type].get(key);
    keys[type].set(key, known === undefined || known === id ? id : null);
  };
  for (const castaway of castaways) {
    add('Castaway', castaway.shortName, castaway.castawayId);
    add('Castaway', castaway.fullName, castaway.castawayId);
    add('Castaway', castaway.fullName.split(' ')[0] ?? '', castaway.castawayId);
  }
  for (const tribe of tribes) add('Tribe', tribe.tribeName, tribe.tribeId);

  return (type: ReferenceType, name: string) => keys[type].get(normalize(name)) ?? null;
}

/** Auto events with the same event, subtype and people are one auto event. */
function autoEventKey(eventName: string, subtype: string | null, references: EventReference[]) {
  if (references.length === 0) return null;
  const refs = references.map((ref) => `${ref.type}_${ref.id}`).sort().join(',');
  return `${eventName}|${subtype ?? ''}|${refs}`;
}

/**
  * Record what Jev found for a claimed check: insert its auto events, or count them
  * against auto events another check already found
  * @param checkId The claimed check
  * @param report The detector's result, or the error it hit
  * @returnObj `DetectorCheckResultResponse`
  */
export default async function completeCheckLogic(
  checkId: number,
  report: DetectorCheckResult
): Promise<DetectorCheckResultResponse> {
  const check = await db
    .select({ episodeId: eventCheckSchema.episodeId, seasonId: episodeSchema.seasonId })
    .from(eventCheckSchema)
    .innerJoin(episodeSchema, eq(eventCheckSchema.episodeId, episodeSchema.episodeId))
    .where(eq(eventCheckSchema.checkId, checkId))
    .then((rows) => rows[0]);
  if (!check) throw new Error(`Check ${checkId} not found`);

  if ('error' in report) {
    await db
      .update(eventCheckSchema)
      .set({ status: 'failed', error: report.error.slice(0, 512) })
      .where(eq(eventCheckSchema.checkId, checkId));
    return { inserted: 0, merged: 0 };
  }

  const resolve = await nameResolver(check.seasonId);
  const autoEvents = report.autoEvents.map((autoEvent: DetectorAutoEventInput) => {
    const references: EventReference[] = [];
    const unmatched: string[] = [];
    for (const ref of autoEvent.references) {
      const id = resolve(ref.type, ref.name);
      if (id === null) unmatched.push(ref.name.slice(0, 64));
      else if (!references.some((known) => known.type === ref.type && known.id === id)) {
        references.push({ type: ref.type, id });
      }
    }
    const notes = autoEvent.notes
      .map((note) => note.trim().slice(0, MAX_NOTE_LENGTH))
      .filter((note) => note.length > 0)
      .slice(0, MAX_NOTES);
    return {
      eventName: autoEvent.eventName,
      subtype: autoEvent.label?.slice(0, 64) ?? null,
      references,
      unmatched,
      notes: notes.length ? notes : null,
      confidence: autoEvent.confidence.event ?? null,
      asks: autoEvent.unresolved,
    };
  });

  const counts = await db.transaction(async (trx) => {
    // Serialise auto event inserts per episode so two checks can't add the same auto event
    await trx.execute(sql`select pg_advisory_xact_lock(hashtext(${`auto_event:${check.episodeId}`}))`);

    // Auto events and the done status are written together, so a claimable check has none yet
    const known = await trx
      .select({
        autoEventId: autoEventSchema.autoEventId,
        eventName: autoEventSchema.eventName,
        subtype: autoEventSchema.subtype,
        references: autoEventSchema.references,
      })
      .from(autoEventSchema)
      .where(eq(autoEventSchema.episodeId, check.episodeId))
      .then((rows) => new Map(rows
        .map((autoEvent) => [autoEventKey(autoEvent.eventName, autoEvent.subtype, autoEvent.references), autoEvent.autoEventId] as const)
        .filter(([key]) => key !== null)));

    let inserted = 0;
    let merged = 0;
    const seen = new Set<string>();
    for (const autoEvent of autoEvents) {
      const key = autoEventKey(autoEvent.eventName, autoEvent.subtype, autoEvent.references);
      if (key !== null) {
        if (seen.has(key)) continue;
        seen.add(key);
        const match = known.get(key);
        if (match !== undefined) {
          await trx
            .update(autoEventSchema)
            .set({ detections: sql`${autoEventSchema.detections} + 1` })
            .where(eq(autoEventSchema.autoEventId, match));
          merged++;
          continue;
        }
      }
      await trx.insert(autoEventSchema).values({ ...autoEvent, checkId, episodeId: check.episodeId });
      inserted++;
    }

    await trx
      .update(eventCheckSchema)
      .set({ status: 'done', detected: report.detected, error: null })
      .where(eq(eventCheckSchema.checkId, checkId));

    return { inserted, merged };
  });

  if (counts.inserted || counts.merged) await revalidateAutoEvents(check.episodeId);
  return counts;
}
