import z from 'zod';
import { BaseEventNames, ReferenceTypes } from '~/lib/events';

// Detectors are separate programs, so their requests are checked field by field

const name = z.string().trim().min(1).max(64);

export const DetectorCheckClaimZod = z.object({
  episodeId: z.number().int().positive(),
  source: name,
  segment: z.string().min(1).max(32),
  questionSetVersion: z.string().min(1).max(64),
  trigger: z.string().max(2000),
  airedStart: z.number().finite(),
  airedEnd: z.number().finite(),
  fingerprint: z.string().regex(/^[0-9a-f]{8}$/).array().max(2000),
});

const AutoEventAskZod = z.object({
  field: z.string().max(64),
  reason: z.string().max(512),
  options: z.object({
    value: z.string().max(64),
    confidence: z.number().optional(),
  }).array().max(50).optional(),
});

export const DetectorCheckResultZod = z.union([
  z.object({
    source: name,
    detected: z.number().nullable(),
    autoEvents: z.object({
      eventName: z.enum(BaseEventNames),
      label: z.string().max(64).nullable(),
      references: z.object({ type: z.enum(ReferenceTypes), name }).array().max(50),
      notes: z.string().max(2000).array().max(50),
      confidence: z.record(z.number()),
      unresolved: AutoEventAskZod.array().max(50),
    }).array().max(50),
  }),
  z.object({
    source: name,
    error: z.string().max(2000),
  }),
]);
