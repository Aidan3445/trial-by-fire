import z from 'zod';
import { type Tribe } from './tribes';
import { type EnrichedCastaway } from './castaways';
import { type LeagueMember } from './leagueMembers';

// Constants inlined from ~/lib/events
export const EventSources = ['Base', 'Custom'] as const;
export const EventTypes = ['Direct', 'Prediction'] as const;
export const ReferenceTypes = ['Castaway', 'Tribe'] as const;

export const EliminationEventNames = ['elim', 'noVoteExit'] as const;
export const ScoringBaseEventNames = [
  'advFound', 'advPlay', 'badAdvPlay', 'advElim', 'spokeEpTitle', 'tribe1st',
  'tribe2nd', 'indivWin', 'indivReward', 'finalists', 'fireWin', 'soleSurvivor',
  'elim'
] as const;

export const BaseEventNames = [
  ...ScoringBaseEventNames,
  'noVoteExit',
  'tribeUpdate',
  'redemption',
  'otherNotes'
] as const;

export const PredictionTimings = [
  'Draft', 'Weekly', 'After Merge', 'Before Finale',
  'Weekly (Premerge only)', 'Weekly (Postmerge only)'
] as const;

export const LivePredictionStatuses = ['Open', 'Closed', 'Resolved'] as const;
export const LivePredictionOptionTypes = [...ReferenceTypes, 'Custom'] as const;

export type EventSource = (typeof EventSources)[number];
export type EventType = (typeof EventTypes)[number];
export type ReferenceType = (typeof ReferenceTypes)[number];

export type EventReference = {
  type: ReferenceType;
  id: number;
};

export type Event = {
  eventSource: EventSource;
  eventType: EventType;
  episodeNumber: number; // episode that the event occurred in
  eventId: number | null;
  eventName: string;
  label: string | null;
  notes: string[] | null;
  episodeId: number;
  customEventRuleId?: number;
};

export type EventWithReferences = Event & {
  references: EventReference[];
};

export type EnrichedEvent = EventWithReferences & {
  points: number | null;
  referenceMap: {
    tribe: Tribe | null;
    pairs: {
      castaway: EnrichedCastaway;
      member: LeagueMember | null;
      secondaries?: LeagueMember[];
    }[];
  }[];
};

export type ScoringBaseEventName = typeof ScoringBaseEventNames[number];
export type EliminationEventName = typeof EliminationEventNames[number];
export type BaseEventName = typeof BaseEventNames[number];

export type Elimination = {
  eventId: number;
  castawayId: number;
};

export type Eliminations = Elimination[][]

export type PredictionTiming = (typeof PredictionTimings)[number];

export type Prediction = {
  predictionId: number;
  eventSource: EventSource;
  predictionEpisodeNumber: number; // episode that the prediction was made in
  eventEpisodeNumber: number | null; // episode that the event occurs in, if any
  eventName: string;
  predictionMakerId: number;
  referenceId: number;
  referenceType: ReferenceType;
  eventId: number | null; // eventId that the prediction is linked to, if any
  bet: number | null;
  hit: boolean | null;
};

export type PredictionWithEvent = Prediction & {
  points: number;
  event: EventWithReferences | undefined;
  timing: PredictionTiming[];
};

export type EnrichedPrediction = {
  event: EnrichedEvent;
  points: number;
  hits: {
    member: LeagueMember
    hit: boolean;
    bet: number | null;
    reference: {
      type: ReferenceType;
      id: number;
      name: string;
      shortName: string;
      color: string;
    };
  }[];
  misses: {
    member: LeagueMember
    reference: {
      type: ReferenceType;
      id: number;
      name: string;
      shortName: string;
      color: string;
    } | null;
    hit: boolean;
    bet: number | null;
  }[];
};

/**
  * Record<episodeNumber, Record<eventId, EventWithReferences>>
  */
export type Events = Record<number, Record<number, EventWithReferences>>;

/**
  * Record<episodeNumber, Record<eventName, Prediction[]>>
  */
export type Predictions = Record<number, Record<string, Prediction[]>>;

export type CustomEvents = {
  events: Events;
  predictions: Predictions;
};

/**
 * Factory for BaseEventInsertZod that accepts a minimum ID value.
 * In production, use minId=0. For testing, use minId=-100 (or similar).
 */
export function createBaseEventInsertZod(minId = 0) {
  return z.object({
    episodeId: z.coerce.number().int().min(minId),
    eventName: z.enum(BaseEventNames),
    label: z.string().max(64).nullable().optional(),
    notes: z.string().array().max(10).nullable().optional(),
    references: z.object({
      type: z.enum(ReferenceTypes),
      id: z.coerce.number().int().min(minId),
    }).array().min(1)
  }).refine((data) => {
    // If eventName is 'tribeUpdate', we need at least one tribe and at least one castaway
    if (data.eventName === 'tribeUpdate') {
      const hasTribe = data.references.some((ref) => ref.type === 'Tribe');
      const hasCastaway = data.references.some((ref) => ref.type === 'Castaway');
      return hasTribe && hasCastaway;
    }
    return true;
  }, { message: 'Tribe Update events must reference at least one tribe and one castaway' });
}

export const BaseEventInsertZod = createBaseEventInsertZod(0);
export type BaseEventInsert = z.infer<typeof BaseEventInsertZod>;

/**
 * Factory for CustomEventInsertZod that accepts a minimum ID value.
 */
export function createCustomEventInsertZod(minId = 0) {
  return z.object({
    episodeId: z.coerce.number().int().min(minId),
    customEventRuleId: z.coerce.number().int().min(minId),
    label: z.string().max(64).nullable().optional(),
    notes: z.string().array().max(10).nullable().optional(),
    references: z.object({
      type: z.enum(ReferenceTypes),
      id: z.coerce.number().int().min(minId),
    }).array().min(1)
  });
}

export const CustomEventInsertZod = createCustomEventInsertZod(0);
export type CustomEventInsert = z.infer<typeof CustomEventInsertZod>;

/**
 * Factory for PredictionInsertZod that accepts a minimum ID value.
 */
export function createPredictionInsertZod(minId = 0) {
  return z.object({
    eventSource: z.enum(EventSources),
    referenceId: z.coerce.number().int().min(minId),
    referenceType: z.enum(ReferenceTypes),
    eventName: z.string().max(64),
    bet: z.coerce.number().int().min(0).nullable(),
  });
}

export const PredictionInsertZod = createPredictionInsertZod(0);
export type PredictionInsert = z.infer<typeof PredictionInsertZod>;

export type MakePrediction = {
  eventSource: EventSource;
  eventName: string;
  label: string;
  description: string;
  points: number;
  referenceTypes: ReferenceType[];
  timing: PredictionTiming[];
  predictionMade: Prediction | null;
  shauhinEnabled?: boolean;
}

/**
  * Record<ReferenceType | 'Member', Record<referneceId, runningScores[]>>
  */
export type Scores = Record<ReferenceType | 'Member', Record<number, number[]>>;
/**
  * Record<memberId, streakCount>
  */
export type Streaks = Record<number, number>;


export type LivePredictionStatus = (typeof LivePredictionStatuses)[number];

export type LivePrediction = {
  status: LivePredictionStatus;
  livePredictionId: number;
  seasonId: number;
  created_at: Date;
  updated_at: Date;
  episodeId: number;
  title: string;
  description: string | null;
  closedAt: Date | null;
  resolvedAt: Date | null;
  paused: boolean;
}

export type LivePredictionInsert = {
  seasonId: number;
  episodeId: number;
  title: string;
  status: LivePredictionStatus;
  livePredictionId?: number;
  created_at?: Date;
  updated_at?: Date;
  description?: string | null;
  closedAt?: Date | null;
  resolvedAt?: Date | null;
  paused?: boolean;
}

export type LivePredictionOption = {
  livePredictionId: number;
  created_at: Date;
  updated_at: Date;
  livePredictionOptionId: number;
  label: string;
  referenceType: ReferenceType | null;
  referenceId: number | null;
  isCorrect: boolean | null;
}

export type LivePredictionOptionInsert = {
  livePredictionId: number;
  label: string;
  created_at?: Date | undefined;
  updated_at?: Date | undefined;
  livePredictionOptionId?: number;
  referenceType?: ReferenceType | null;
  referenceId?: number | null;
  isCorrect?: boolean | null;
}

export type LivePredictionResponse = {
  livePredictionResponseId: number;
  livePredictionId: number;
  created_at: Date;
  updated_at: Date;
  optionId: number;
  userId: string;
}

export type LivePredictionResponseInsert = {
  livePredictionId: number;
  optionId: number;
  userId: string;
  livePredictionResponseId?: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface LivePredictionWithOptions extends LivePrediction {
  options: LivePredictionOption[];
  responses: LivePredictionResponse[];
  userResponse?: LivePredictionResponse | null;
}

export interface LivePredictionResult {
  livePredictionId: number;
  title: string;
  totalResponses: number;
  correctResponses: number;
  userCorrect: boolean | null;
}

export interface LivePredictionUserStats {
  userId: string;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
  currentStreak: number;
  bestStreak: number;
}

export interface LivePredictionOptionInput {
  label: string;
  referenceType?: ReferenceType;
  referenceId?: number;
}

export type LivePredictionOptionType = (typeof LivePredictionOptionTypes)[number];

export interface LivePredictionTemplate {
  title: string;
  description?: string;
  optionType: LivePredictionOptionType;
}

// Mobile-only type
export interface LeaderboardEntry {
  userId: string;
  username: string;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number;
}
