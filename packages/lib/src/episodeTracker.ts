import {
  type CustomEvents, type Eliminations, type Events, type EventSource, type EventWithReferences, type KeyEpisodes,
  type LeagueRules, type Prediction, type Predictions, type ReferenceType, type SelectionTimelines, type TribesTimeline,
} from '@survivor/types';
import { BaseEventFullName, scoringEventName } from './events';
import { defaultBasePredictionRules, defaultBaseRules, defaultShauhinModeSettings } from './leagues';
import { isShauhinModeActive } from './scores';
import { findTribeCastaways } from './utils';

/** An event that scored points for a castaway this episode. */
export type TrackedEvent = {
  eventId: number | null;
  eventSource: EventSource;
  eventName: string;
  label: string;
  points: number;
  /** Earned through the castaway's tribe rather than by name */
  viaTribe: boolean;
};

export type TrackedPick = {
  castawayId: number;
  events: TrackedEvent[];
  points: number;
};

export type TrackedSecondary = TrackedPick & {
  multiplier: number;
  /** Points the castaway earned before the multiplier */
  basePoints: number;
};

export type PredictionStatus = 'hit' | 'miss' | 'pending';

export type TrackedPrediction = {
  predictionId: number;
  eventSource: EventSource;
  eventName: string;
  label: string;
  reference: { type: ReferenceType; id: number };
  status: PredictionStatus;
  /** Points a hit is worth */
  points: number;
  bet: number | null;
  /** What the bet adds or takes away: +bet on a hit, -bet on a miss, 0 while pending */
  betResult: number;
};

export type EpisodeTracker = {
  episodeNumber: number;
  pick: TrackedPick | null;
  secondary: TrackedSecondary | null;
  predictions: TrackedPrediction[];
  /** Bets count for this episode's predictions */
  betsActive: boolean;
  shotInTheDark: boolean;
  /** Points from the pick, secondary and settled predictions so far */
  points: number;
};

export type EpisodeTrackerInput = {
  memberId: number;
  episodeNumber: number;
  baseEvents: Events;
  customEvents?: CustomEvents;
  basePredictions?: Predictions;
  eliminations: Eliminations;
  tribesTimeline: TribesTimeline;
  keyEpisodes: KeyEpisodes;
  selectionTimelines: SelectionTimelines;
  rules: LeagueRules | null;
};

/**
  * How a member is doing in one episode: what their pick and secondary have
  * earned, and where their predictions for it stand. Scores events the same way
  * compileScores does so the totals agree.
  * @returnObj `EpisodeTracker`
  */
export function trackEpisode({
  memberId,
  episodeNumber,
  baseEvents,
  customEvents,
  basePredictions,
  eliminations,
  tribesTimeline,
  keyEpisodes,
  selectionTimelines,
  rules,
}: EpisodeTrackerInput): EpisodeTracker {
  const baseRules = rules?.base ?? defaultBaseRules;
  const predictionRules = rules?.basePrediction ?? defaultBasePredictionRules;
  const customRules = rules?.custom ?? [];

  // Castaways an event scores: named ones, plus everyone on a named tribe
  const scoredCastaways = (event: EventWithReferences) => {
    const named = new Set<number>();
    const viaTribe = new Set<number>();
    event.references.forEach((ref) => {
      if (ref.type === 'Castaway') named.add(ref.id);
      else findTribeCastaways(tribesTimeline, eliminations, ref.id, episodeNumber)
        .forEach((castawayId) => viaTribe.add(castawayId));
    });
    return { named, viaTribe };
  };

  const castawayEvents = (castawayId: number) => {
    const events: TrackedEvent[] = [];
    const track = (event: EventWithReferences, points: number, label: string) => {
      const { named, viaTribe } = scoredCastaways(event);
      if (!named.has(castawayId) && !viaTribe.has(castawayId)) return;
      events.push({
        eventId: event.eventId,
        eventSource: event.eventSource,
        eventName: event.eventName,
        label,
        points,
        viaTribe: !named.has(castawayId),
      });
    };

    Object.values(baseEvents[episodeNumber] ?? {}).forEach((event) => {
      const scoredAs = scoringEventName(event.eventName);
      if (!scoredAs) return;
      track(event, baseRules[scoredAs], event.label?.trim() || BaseEventFullName[scoredAs]);
    });
    Object.values(customEvents?.events[episodeNumber] ?? {}).forEach((event) => {
      if (event.eventType === 'Prediction') return;
      const points = customRules.find((rule) => rule.eventName === event.eventName)?.points;
      if (!points) return;
      track(event, points, event.label?.trim() || event.eventName);
    });
    return events;
  };

  const sum = (events: TrackedEvent[]) => events.reduce((total, event) => total + event.points, 0);

  // The castaway this member had at the episode; later swaps don't apply to it
  const picks = selectionTimelines.memberCastaways[memberId] ?? [];
  const pickId = picks[Math.min(episodeNumber, picks.length - 1)];
  let pick: TrackedPick | null = null;
  if (pickId) {
    const events = castawayEvents(pickId);
    pick = { castawayId: pickId, events, points: sum(events) };
  }

  let secondary: TrackedSecondary | null = null;
  const secondaryId = selectionTimelines.secondaryPicks?.[memberId]?.[episodeNumber];
  const multiplier = rules?.secondaryPick?.enabled ? rules.secondaryPick.multiplier : 0;
  if (secondaryId && multiplier > 0) {
    const events = castawayEvents(secondaryId);
    const basePoints = sum(events);
    secondary = { castawayId: secondaryId, events, basePoints, multiplier, points: basePoints * multiplier };
  }

  const shauhinMode = rules?.shauhinMode ?? defaultShauhinModeSettings;
  const betsActive = isShauhinModeActive(shauhinMode, keyEpisodes, episodeNumber);

  const status = (prediction: Prediction): PredictionStatus =>
    prediction.hit ? 'hit' : prediction.eventId !== null ? 'miss' : 'pending';
  const mine = (predictions: Predictions | undefined) =>
    Object.values(predictions?.[episodeNumber] ?? {}).flat()
      .filter((prediction) => prediction.predictionMakerId === memberId);

  const predictions: TrackedPrediction[] = [];
  mine(basePredictions).forEach((prediction) => {
    const scoredAs = scoringEventName(prediction.eventName);
    const rule = scoredAs ? predictionRules[scoredAs] : undefined;
    if (!scoredAs || !rule?.enabled || !rule.points) return;
    const result = status(prediction);
    const bet = betsActive && prediction.bet ? Math.max(0, Math.min(prediction.bet, shauhinMode.maxBet)) : null;
    predictions.push({
      predictionId: prediction.predictionId,
      eventSource: 'Base',
      eventName: prediction.eventName,
      label: BaseEventFullName[scoredAs],
      reference: { type: prediction.referenceType, id: prediction.referenceId },
      status: result,
      points: rule.points,
      bet,
      betResult: bet === null ? 0 : result === 'hit' ? bet : result === 'miss' ? -bet : 0,
    });
  });
  mine(customEvents?.predictions).forEach((prediction) => {
    const points = customRules.find((rule) => rule.eventName === prediction.eventName)?.points;
    if (!points) return;
    predictions.push({
      predictionId: prediction.predictionId,
      eventSource: 'Custom',
      eventName: prediction.eventName,
      label: prediction.eventName,
      reference: { type: prediction.referenceType, id: prediction.referenceId },
      status: status(prediction),
      points,
      bet: null,
      betResult: 0,
    });
  });

  const predictionPoints = predictions.reduce((total, prediction) =>
    total + (prediction.status === 'hit' ? prediction.points : 0) + prediction.betResult, 0);

  return {
    episodeNumber,
    pick,
    secondary,
    predictions,
    betsActive,
    shotInTheDark: selectionTimelines.shotInTheDark?.[memberId]?.episodeNumber === episodeNumber,
    points: (pick?.points ?? 0) + (secondary?.points ?? 0) + predictionPoints,
  };
}
