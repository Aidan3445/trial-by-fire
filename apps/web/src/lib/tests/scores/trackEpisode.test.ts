import { describe, it, expect } from 'vitest';
import { compileScores, trackEpisode } from '~/lib/scores';
import { defaultBaseRules, defaultBasePredictionRules } from '~/lib/leagues';
import type { Events, Eliminations, EventWithReferences, Predictions, Prediction } from '~/types/events';
import type { LeagueRules, SelectionTimelines } from '~/types/leagues';
import type { KeyEpisodes } from '~/types/episodes';
import type { TribesTimeline } from '~/types/tribes';

const event = (eventId: number, eventName: string, references: EventWithReferences['references'], label: string | null = null): EventWithReferences => ({
  eventId,
  eventName,
  references,
  eventSource: 'Base',
  eventType: 'Direct',
  episodeId: 40,
  episodeNumber: 4,
  label,
  notes: null,
});

const prediction = (predictionId: number, eventName: string, referenceId: number, overrides: Partial<Prediction>): Prediction => ({
  predictionId,
  eventSource: 'Base',
  predictionEpisodeNumber: 4,
  eventEpisodeNumber: 4,
  eventName,
  predictionMakerId: 7,
  referenceId,
  referenceType: 'Castaway',
  eventId: null,
  bet: null,
  hit: null,
  ...overrides,
});

describe('trackEpisode', () => {
  // Tribe 3 holds castaways 1-3 from episode 3 on
  const tribesTimeline: TribesTimeline = {
    1: { 3: [2, 4, 6], 4: [1, 3, 5] },
    3: { 3: [1, 2, 3], 4: [4, 5, 6] },
  };
  const eliminations: Eliminations = [[], [], [], [], []];
  const keyEpisodes: KeyEpisodes = { previousEpisode: null, nextEpisode: null, mergeEpisode: null };

  const baseEvents: Events = {
    1: {
      100: event(100, 'tribeUpdate', [{ type: 'Tribe', id: 3 }, { type: 'Castaway', id: 2 }, { type: 'Castaway', id: 4 }, { type: 'Castaway', id: 6 }]),
      101: event(101, 'tribeUpdate', [{ type: 'Tribe', id: 4 }, { type: 'Castaway', id: 1 }, { type: 'Castaway', id: 3 }, { type: 'Castaway', id: 5 }]),
    },
    4: {
      1: event(1, 'tribe1st', [{ type: 'Tribe', id: 3 }], '1st Tribe Immunity'),
      2: event(2, 'advFound', [{ type: 'Castaway', id: 1 }]),
      3: event(3, 'noVoteExit', [{ type: 'Castaway', id: 5 }], 'Quit'),
    },
  };

  const rules: LeagueRules = {
    base: { ...defaultBaseRules, tribe1st: 2, advFound: 5, elim: -3 },
    basePrediction: {
      ...defaultBasePredictionRules,
      elim: { ...defaultBasePredictionRules.elim, enabled: true, points: 4 },
      tribe1st: { ...defaultBasePredictionRules.tribe1st, enabled: true, points: 3 },
      advFound: { ...defaultBasePredictionRules.advFound, enabled: true, points: 2 },
    },
    shauhinMode: {
      enabled: true,
      maxBet: 10,
      maxBetsPerWeek: 3,
      startWeek: 'After Premiere',
      customStartWeek: null,
      enabledBets: ['elim'],
    },
    custom: [],
    secondaryPick: { enabled: true, canPickOwnSurvivor: false, lockoutPeriod: 0, publicPicks: false, multiplier: 0.5 },
  };

  const selectionTimelines: SelectionTimelines = {
    memberCastaways: { 7: [null, 1] },
    castawayMembers: { 1: [null, 7] },
    secondaryPicks: { 7: [null, null, null, null, 2] },
  };

  const basePredictions: Predictions = {
    4: {
      elim: [prediction(1, 'elim', 5, { eventId: 3, hit: true, bet: 6 })],
      advFound: [prediction(2, 'advFound', 3, { eventId: 2, hit: false })],
      tribe1st: [prediction(3, 'tribe1st', 4, { referenceType: 'Tribe' })],
    },
  };

  const tracker = trackEpisode({
    memberId: 7,
    episodeNumber: 4,
    baseEvents,
    basePredictions,
    eliminations,
    tribesTimeline,
    keyEpisodes,
    selectionTimelines,
    rules,
  });

  it('lists what the pick earned, by name and through their tribe', () => {
    expect(tracker.pick?.castawayId).toBe(1);
    expect(tracker.pick?.events.map((e) => [e.label, e.points, e.viaTribe])).toEqual([
      ['1st Tribe Immunity', 2, true],
      ['Advantage Found', 5, false],
    ]);
    expect(tracker.pick?.points).toBe(7);
  });

  it('scales the secondary pick by the multiplier', () => {
    expect(tracker.secondary).toMatchObject({ castawayId: 2, basePoints: 2, multiplier: 0.5, points: 1 });
  });

  it('marks predictions hit, miss or pending with their bets', () => {
    expect(tracker.predictions.map((p) => [p.eventName, p.status, p.points, p.betResult])).toEqual([
      ['elim', 'hit', 4, 6],
      ['advFound', 'miss', 2, 0],
      ['tribe1st', 'pending', 3, 0],
    ]);
  });

  it('agrees with compileScores on the episode total', () => {
    const { scores } = compileScores(baseEvents, eliminations, tribesTimeline, keyEpisodes,
      selectionTimelines, { events: [], predictions: [] }, basePredictions, rules, 0);
    const member = scores.Member[7]!;
    expect(tracker.points).toBe(member[4]! - member[3]!);
  });
});
