import { describe, it, expect } from 'vitest';
import { autoEventFormSubtype, autoEventKept, autoEventLabel, findScoredMatch, fingerprintOverlap } from '~/lib/events';
import { type EventReference } from '~/types/events';

const toka: EventReference = { type: 'Tribe', id: 1 };
const savu: EventReference = { type: 'Tribe', id: 2 };
const ana: EventReference = { type: 'Castaway', id: 10 };

describe('fingerprintOverlap', () => {
  it('measures against the smaller fingerprint', () => {
    expect(fingerprintOverlap(['a', 'b'], ['a', 'b', 'c', 'd'])).toBe(1);
    expect(fingerprintOverlap(['a', 'x', 'y', 'z'], ['a', 'b', 'c', 'd'])).toBe(0.25);
  });

  it('is zero when either side is empty', () => {
    expect(fingerprintOverlap([], ['a'])).toBe(0);
  });
});

describe('autoEventLabel', () => {
  it('adds the form prefix to a known subtype', () => {
    expect(autoEventLabel('tribe1st', 'Tribe Immunity')).toBe('1st Tribe Immunity');
    expect(autoEventLabel('elim', 'Voted Out')).toBe('Voted Out');
  });

  it('keeps an unknown subtype as a custom label', () => {
    expect(autoEventLabel('tribe1st', 'Fishing Gear')).toBe('Fishing Gear');
    expect(autoEventFormSubtype('tribe1st', 'Fishing Gear')).toBe('Custom');
    expect(autoEventFormSubtype('tribe1st', null)).toBe('');
  });
});

describe('autoEventKept', () => {
  const autoEvent = { eventName: 'tribe1st' as const, subtype: 'Tribe Immunity', references: [toka] };

  it('counts an edited event as using the auto event', () => {
    expect(autoEventKept(autoEvent, { eventName: 'tribe1st', label: '1st Tribe Reward', references: [savu] })).toBe(true);
    expect(autoEventKept(autoEvent, { eventName: 'tribe2nd', label: '2nd Tribe Reward', references: [toka] })).toBe(true);
  });

  it('does not count an event that replaced everything', () => {
    expect(autoEventKept(autoEvent, { eventName: 'elim', label: 'Voted Out', references: [ana] })).toBe(false);
  });
});

describe('findScoredMatch', () => {
  const events = [{ episodeId: 5, eventName: 'elim', label: 'Voted Out', references: [ana] }];

  it('finds the same event for a shared reference in the episode', () => {
    expect(findScoredMatch({ episodeId: 5, eventName: 'elim', references: [ana] }, events)).toBe(events[0]);
  });

  it('ignores other episodes and other people', () => {
    expect(findScoredMatch({ episodeId: 6, eventName: 'elim', references: [ana] }, events)).toBeNull();
    expect(findScoredMatch({ episodeId: 5, eventName: 'elim', references: [toka] }, events)).toBeNull();
  });
});
