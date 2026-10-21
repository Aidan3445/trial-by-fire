import { describe, it, expect } from 'vitest';
import { editableEventTribe, tribeNameTaken } from '~/lib/events';
import { BaseEventInsertZod, tribeUpdateProblem, type EventReference } from '~/types/events';

const tribe = (tribeId: number, createdByEventId: number | null = null) => ({ tribeId, createdByEventId });
const castaway: EventReference = { type: 'Castaway', id: 1 };
const tribeRef = (id: number): EventReference => ({ type: 'Tribe', id });
const newTribe = { tribeName: 'Dina', tribeColor: '#ff0000' };

describe('tribeUpdateProblem', () => {
  it('accepts one existing tribe', () => {
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [tribeRef(1), castaway] })).toBeNull();
  });

  it('accepts one new tribe with no existing tribe', () => {
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [castaway], newTribe })).toBeNull();
  });

  it('rejects two existing tribes', () => {
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [tribeRef(1), tribeRef(2), castaway] }))
      .toMatch(/exactly one tribe/);
  });

  it('rejects a new tribe alongside an existing one', () => {
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [tribeRef(1), castaway], newTribe }))
      .toMatch(/exactly one tribe/);
  });

  it('rejects no tribe and no castaway', () => {
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [castaway] })).toMatch(/exactly one tribe/);
    expect(tribeUpdateProblem({ eventName: 'tribeUpdate', references: [tribeRef(1)] })).toMatch(/castaway/);
  });

  it('rejects tribe fields on other events', () => {
    expect(tribeUpdateProblem({ eventName: 'elim', references: [castaway], newTribe })).toMatch(/Only Tribe Update/);
    expect(tribeUpdateProblem({ eventName: 'elim', references: [castaway] })).toBeNull();
  });

  it('is enforced by the insert schema', () => {
    const event = { episodeId: 1, eventName: 'tribeUpdate', label: 'Tribe Swap', references: [tribeRef(1), tribeRef(2), castaway] };
    expect(BaseEventInsertZod.safeParse(event).success).toBe(false);
    expect(BaseEventInsertZod.safeParse({ ...event, references: [castaway], newTribe }).success).toBe(true);
  });
});

describe('editableEventTribe', () => {
  const event = { eventSource: 'Base' as const, eventName: 'tribeUpdate' as const, eventId: 7 };
  const tribes = [tribe(1), tribe(2, 7), tribe(3, 8)];

  it('returns the tribe the event created when it is the only tribe', () => {
    expect(editableEventTribe(event, [tribeRef(2), castaway], tribes)?.tribeId).toBe(2);
  });

  it('is null when another tribe is selected with it', () => {
    expect(editableEventTribe(event, [tribeRef(1), tribeRef(2), castaway], tribes)).toBeNull();
  });

  it('is null for a tribe the event did not create', () => {
    expect(editableEventTribe(event, [tribeRef(1), castaway], tribes)).toBeNull();
    expect(editableEventTribe(event, [tribeRef(3), castaway], tribes)).toBeNull();
  });

  it('is null for other events', () => {
    expect(editableEventTribe({ ...event, eventName: 'elim' }, [tribeRef(2)], tribes)).toBeNull();
    expect(editableEventTribe({ ...event, eventSource: 'Custom' }, [tribeRef(2)], tribes)).toBeNull();
  });
});

describe('tribeNameTaken', () => {
  it('ignores case and surrounding spaces', () => {
    expect(tribeNameTaken(' savu ', ['Savu', 'Toka'])).toBe(true);
    expect(tribeNameTaken('Dina', ['Savu', 'Toka'])).toBe(false);
  });
});
