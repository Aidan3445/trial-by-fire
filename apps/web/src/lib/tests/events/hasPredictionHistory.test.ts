import { describe, it, expect } from 'vitest';
import { hasPredictionHistory } from '~/lib/events';
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
