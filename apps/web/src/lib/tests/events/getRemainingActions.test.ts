import { describe, it, expect } from 'vitest';
import { getRemainingActions } from '~/lib/events';
import { type Episode, type KeyEpisodes } from '~/types/episodes';
import { type LeagueRules, type CustomEventRule } from '~/types/leagues';
import { type PredictionTiming } from '~/types/events';

const episode = (overrides: Partial<Episode>) => ({
  isMerge: false,
  isFinale: false,
  airStatus: 'Aired',
  ...overrides,
}) as Episode;

const keyEpisodes = (overrides: Partial<KeyEpisodes> = {}): KeyEpisodes => ({
  previousEpisode: episode({ episodeNumber: 9 }),
  nextEpisode: episode({ episodeNumber: 10, airStatus: 'Upcoming' }),
  mergeEpisode: episode({ episodeNumber: 7 }),
  ...overrides,
});

const customPrediction = (timing: PredictionTiming[]) => ({
  eventType: 'Prediction',
  timing,
}) as CustomEventRule;

const rulesWith = (...timings: PredictionTiming[][]): LeagueRules => ({
  base: null,
  basePrediction: null,
  shauhinMode: null,
  custom: timings.map(customPrediction),
  secondaryPick: null,
});

describe('getRemainingActions', () => {
  it('returns nothing without predictions or secondaries', () => {
    expect(getRemainingActions({
      rules: rulesWith(),
      secondaryPickEnabled: false,
      keyEpisodes: keyEpisodes(),
    })).toEqual([]);
  });

  it('includes weekly predictions', () => {
    expect(getRemainingActions({
      rules: rulesWith(['Weekly']),
      secondaryPickEnabled: false,
      keyEpisodes: keyEpisodes(),
    })).toEqual(['Weekly predictions']);
  });

  it('drops premerge-only weekly predictions after the merge', () => {
    expect(getRemainingActions({
      rules: rulesWith(['Weekly (Premerge only)']),
      secondaryPickEnabled: false,
      keyEpisodes: keyEpisodes(),
    })).toEqual([]);
  });

  it('keeps after merge predictions until the window after the merge closes', () => {
    const rules = rulesWith(['After Merge']);
    const beforeMerge = keyEpisodes({ mergeEpisode: episode({ episodeNumber: 11, airStatus: 'Upcoming' }) });
    const justMerged = keyEpisodes({
      previousEpisode: episode({ episodeNumber: 7, isMerge: true }),
    });

    expect(getRemainingActions({ rules, secondaryPickEnabled: false, keyEpisodes: beforeMerge }))
      .toEqual(['After merge predictions']);
    expect(getRemainingActions({ rules, secondaryPickEnabled: false, keyEpisodes: justMerged }))
      .toEqual(['After merge predictions']);
    expect(getRemainingActions({ rules, secondaryPickEnabled: false, keyEpisodes: keyEpisodes() }))
      .toEqual([]);
  });

  it('ignores disabled base predictions and direct custom events', () => {
    const rules: LeagueRules = {
      ...rulesWith(),
      basePrediction: {
        soleSurvivor: { enabled: false, timing: ['Before Finale'] },
      } as unknown as LeagueRules['basePrediction'],
      custom: [{ eventType: 'Direct', timing: ['Weekly'] } as unknown as CustomEventRule],
    };
    expect(getRemainingActions({ rules, secondaryPickEnabled: false, keyEpisodes: keyEpisodes() }))
      .toEqual([]);
  });

  it('lists every remaining kind in order', () => {
    const rules: LeagueRules = {
      ...rulesWith(['Weekly']),
      basePrediction: {
        soleSurvivor: { enabled: true, timing: ['Before Finale'] },
      } as unknown as LeagueRules['basePrediction'],
    };
    expect(getRemainingActions({ rules, secondaryPickEnabled: true, keyEpisodes: keyEpisodes() }))
      .toEqual(['Weekly predictions', 'Before finale predictions', 'Secondary picks']);
  });

  it('returns nothing once the finale has aired', () => {
    expect(getRemainingActions({
      rules: rulesWith(['Weekly'], ['Before Finale']),
      secondaryPickEnabled: true,
      keyEpisodes: keyEpisodes({ previousEpisode: episode({ episodeNumber: 13, isFinale: true }) }),
    })).toEqual([]);
  });
});
