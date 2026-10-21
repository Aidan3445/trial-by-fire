import 'server-only';

import { and, eq, sql } from 'drizzle-orm';
import { db } from '~/server/db';
import { eventCheckSchema, autoEventSchema } from '~/server/db/schema/autoEvents';
import { fingerprintOverlap, SAME_CHECK_OVERLAP } from '~/lib/events';
import { type DetectorCheckClaim, type DetectorCheckClaimResult } from '~/types/events';
import { revalidateAutoEvents } from '~/services/autoEvents/query/autoEvents';

/** A running check whose source went quiet this long can be taken over. */
const STALE_CLAIM_MS = 5 * 60 * 1000;

/**
  * Claim a check before asking Jev about it. If another source already checked
  * the same scene, count this detection instead so Jev is only asked once.
  * @param claim The check the detector closed
  * @returns claimed: ask Jev and report back; duplicate: skip it
  * @returnObj `DetectorCheckClaimResult`
  */
export default async function claimCheckLogic(claim: DetectorCheckClaim): Promise<DetectorCheckClaimResult> {
  const result = await db.transaction(async (trx) => {
    // One claim at a time per scene type, so two sources can't both insert it
    await trx.execute(sql`select pg_advisory_xact_lock(hashtext(${`event_check:${claim.episodeId}:${claim.segment}`}))`);

    const checks = await trx
      .select()
      .from(eventCheckSchema)
      .where(and(
        eq(eventCheckSchema.episodeId, claim.episodeId),
        eq(eventCheckSchema.segment, claim.segment)));

    const match = checks
      .map((check) => ({ check, overlap: fingerprintOverlap(claim.fingerprint, check.fingerprint) }))
      .filter(({ overlap }) => overlap >= SAME_CHECK_OVERLAP)
      .sort((a, b) => b.overlap - a.overlap)[0]?.check;

    if (!match) {
      const checkId = await trx
        .insert(eventCheckSchema)
        .values({
          episodeId: claim.episodeId,
          segment: claim.segment,
          questionSetVersion: claim.questionSetVersion,
          claimedBy: claim.source,
          sources: [claim.source],
          trigger: claim.trigger.slice(0, 256),
          airedStart: claim.airedStart,
          airedEnd: claim.airedEnd,
          fingerprint: claim.fingerprint,
        })
        .returning({ checkId: eventCheckSchema.checkId })
        .then((rows) => rows[0]!.checkId);
      return { result: { checkId, status: 'claimed' } as const, countedAutoEvents: false };
    }

    // A new source seeing the same scene counts as another detection
    const newSource = !match.sources.includes(claim.source);
    if (newSource) {
      await trx
        .update(eventCheckSchema)
        .set({
          sources: [...match.sources, claim.source],
          detections: match.detections + 1,
        })
        .where(eq(eventCheckSchema.checkId, match.checkId));
      await trx
        .update(autoEventSchema)
        .set({ detections: sql`${autoEventSchema.detections} + 1` })
        .where(eq(autoEventSchema.checkId, match.checkId));
    }

    // Take over a check that failed, or that its source abandoned or is retrying
    const stale = Date.now() - match.updated_at.getTime() > STALE_CLAIM_MS;
    if (match.status === 'failed' ||
      (match.status === 'running' && (match.claimedBy === claim.source || stale))) {
      await trx
        .update(eventCheckSchema)
        .set({ status: 'running', claimedBy: claim.source, error: null })
        .where(eq(eventCheckSchema.checkId, match.checkId));
      return { result: { checkId: match.checkId, status: 'claimed' } as const, countedAutoEvents: newSource };
    }

    const autoEvents = await trx
      .select({ count: sql<number>`count(*)::int` })
      .from(autoEventSchema)
      .where(eq(autoEventSchema.checkId, match.checkId))
      .then((rows) => rows[0]?.count ?? 0);

    return {
      result: {
        checkId: match.checkId,
        status: 'duplicate',
        detections: match.detections + (newSource ? 1 : 0),
        autoEvents,
      } as const,
      countedAutoEvents: newSource && autoEvents > 0,
    };
  });

  if (result.countedAutoEvents) await revalidateAutoEvents(claim.episodeId);
  return result.result;
}
