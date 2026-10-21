import { type BaseEventName, type EventReference, type ReferenceType } from './events';

/**
 * Auto events come from the system one caption scanner
 */

export const EventCheckStatuses = ['running', 'done', 'failed'] as const;
export type EventCheckStatus = (typeof EventCheckStatuses)[number];

export const AutoEventStatuses = ['pending', 'accepted', 'denied'] as const;
export type AutoEventStatus = (typeof AutoEventStatuses)[number];

/** A field the detector could not settle from the transcript and needs to be populated manually */
export type AutoEventAsk = {
  field: string;
  reason: string;
  options?: { value: string; confidence?: number }[];
};

export type AutoEvent = {
  autoEventId: number;
  checkId: number;
  seasonId: number;
  episodeId: number;
  episodeNumber: number;
  /** Scene type the check came from: tribal, challenge, advantage found... */
  segment: string;
  /** Caption that opened the check */
  trigger: string | null;
  eventName: BaseEventName;
  /** Entry of BaseEventLabels[eventName], without the prefix */
  subtype: string | null;
  references: EventReference[];
  /** Names the detector gave that match no castaway or tribe */
  unmatched: string[];
  notes: string[] | null;
  /** Confidence the event happened, 0-1 */
  confidence: number | null;
  asks: AutoEventAsk[];
  /** How many times detectors reported this auto event */
  detections: number;
  status: AutoEventStatus;
  viewed: boolean;
  /** An event was created from this auto event keeping at least some of its data */
  used: boolean;
  baseEventId: number | null;
  createdAt: Date;
};

/** For GET /api/detector/context */
export type DetectorContext = {
  seasonId: number;
  seasonName: string;
  episodeId: number;
  episodeNumber: number;
  title: string | null;
  host: string;
  /** Castaways still in the game at the start of the episode */
  cast: string[];
  eliminated: string[];
  /** Tribes with members this episode, post merge can leave empty */
  tribes: string[];
};

/** For POST /api/detector/checks */
export type DetectorCheckClaim = {
  episodeId: number;
  /** Identifier for the scan source, for now just me */
  source: string;
  segment: string;
  questionSetVersion: string;
  trigger: string;
  /** Seconds into the source's own capture */
  airedStart: number;
  airedEnd: number;
  /** Hashes of the check's captions, used to match the same scene across sources */
  fingerprint: string[];
};

export type DetectorCheckClaimResult =
  | { checkId: number; status: 'claimed' }
  | { checkId: number; status: 'duplicate'; detections: number; autoEvents: number };

export type DetectorAutoEventInput = {
  eventName: BaseEventName;
  label: string | null;
  references: { type: ReferenceType; name: string }[];
  notes: string[];
  confidence: Record<string, number>;
  unresolved: AutoEventAsk[];
};

/** For POST /api/detector/checks/[checkId] */
export type DetectorCheckResult = {
  source: string;
  detected: number | null;
  autoEvents: DetectorAutoEventInput[];
} | {
  source: string;
  error: string;
};

export type DetectorCheckResultResponse = {
  inserted: number;
  merged: number;
};
