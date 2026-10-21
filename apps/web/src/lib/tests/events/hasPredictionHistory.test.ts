import { describe, it, expect } from 'vitest';
import { baseEventsVersion, hasPredictionHistory } from '~/lib/events';
import { type Prediction, type Predictions } from '~/types/events';

const prediction = (predictionEpisodeNumber: number): Prediction => ({
  predictionId: 1,
  eventSource: 'Base',
  predictionEpisodeNumber,
  eventEpisodeNumber: null,
  eventName: 'elim',
  predictionMakerId: 1,
  referenceId: 1,
  referenceType: 'Castaway',
  eventId: null,
  bet: null,
  hit: null,
});

describe('hasPredictionHistory', () => {
  const base: Predictions = { 3: { elim: [prediction(3)] } };

  it('is true once a prediction episode has aired', () => {
    expect(hasPredictionHistory([base, undefined], 3)).toBe(true);
    expect(hasPredictionHistory([undefined, base], 4)).toBe(true);
  });

  it('ignores predictions for episodes that have not aired', () => {
    expect(hasPredictionHistory([base], 2)).toBe(false);
  });

  it('is false with no aired episodes or no predictions', () => {
    expect(hasPredictionHistory([base], undefined)).toBe(false);
    expect(hasPredictionHistory([{ 1: { elim: [] } }, {}], 5)).toBe(false);
  });
});

describe('baseEventsVersion', () => {
  const event = (eventId: number, references: { type: 'Castaway' | 'Tribe'; id: number }[]) => ({
    eventSource: 'Base' as const,
    eventType: 'Direct' as const,
    episodeNumber: 2,
    episodeId: 20,
    eventId,
    eventName: 'elim',
    label: null,
    notes: null,
    references,
  });

  it('changes when an event is added or its references change', () => {
    const before = baseEventsVersion({ 2: { 1: event(1, [{ type: 'Castaway', id: 4 }]) } });
    const added = baseEventsVersion({ 2: { 1: event(1, [{ type: 'Castaway', id: 4 }]), 2: event(2, [{ type: 'Castaway', id: 5 }]) } });
    const edited = baseEventsVersion({ 2: { 1: event(1, [{ type: 'Castaway', id: 6 }]) } });
    expect(added).not.toBe(before);
    expect(edited).not.toBe(before);
  });

  it('ignores reference order and is empty before events load', () => {
    const a = baseEventsVersion({ 2: { 1: event(1, [{ type: 'Tribe', id: 1 }, { type: 'Castaway', id: 4 }]) } });
    const b = baseEventsVersion({ 2: { 1: event(1, [{ type: 'Castaway', id: 4 }, { type: 'Tribe', id: 1 }]) } });
    expect(a).toBe(b);
    expect(baseEventsVersion(undefined)).toBe('');
  });
});
