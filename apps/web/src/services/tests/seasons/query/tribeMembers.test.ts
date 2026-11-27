import { describe, it, expect, vi, beforeEach } from 'vitest';
import getTribeMembers from '~/services/seasons/query/tribeMembers';
import getTribesTimeline from '~/services/seasons/query/tribesTimeline';
import getEliminations from '~/services/seasons/query/eliminations';
import { type TribesTimeline } from '~/types/tribes';
import { type Eliminations } from '~/types/events';

vi.mock('server-only', () => ({}));
vi.mock('~/services/seasons/query/tribesTimeline', () => ({ default: vi.fn() }));
vi.mock('~/services/seasons/query/eliminations', () => ({ default: vi.fn() }));

// Two tribes, merge into tribe 3 at episode 3
const tribesTimeline: TribesTimeline = {
  1: {
    1: [1, 2, 3],
    2: [4, 5, 6],
  },
  3: {
    3: [2, 3, 5, 6],
  },
};

// 1 and 4 go out pre-merge, 2 and 5 go out post-merge (jury)
const eliminations: Eliminations = [
  [],
  [{ castawayId: 1, eventId: 1 }],
  [{ castawayId: 4, eventId: 2 }],
  [{ castawayId: 2, eventId: 3 }],
  [{ castawayId: 5, eventId: 4 }],
];

describe('getTribeMembers', () => {
  beforeEach(() => {
    vi.mocked(getTribesTimeline).mockResolvedValue(tribesTimeline);
    vi.mocked(getEliminations).mockResolvedValue(eliminations);
  });

  it('keeps a castaway on their tribe in the episode they are eliminated', async () => {
    const result = await getTribeMembers(1, 1);
    expect(result[1]?.sort()).toEqual([1, 2, 3]);
    expect(result[2]?.sort()).toEqual([4, 5, 6]);
  });

  it('drops castaways eliminated in the previous episode', async () => {
    const result = await getTribeMembers(1, 2);
    expect(result[1]?.sort()).toEqual([2, 3]);
    expect(result[2]?.sort()).toEqual([4, 5, 6]);
  });

  it('leaves out tribes that do not exist yet', async () => {
    const result = await getTribeMembers(1, 2);
    expect(result[3]).toBeUndefined();
  });

  it('only matches the merge tribe with castaways still in the game', async () => {
    const result = await getTribeMembers(1, 5);
    expect(result[1]).toEqual([]);
    expect(result[2]).toEqual([]);
    expect(result[3]?.sort()).toEqual([3, 6]);
  });

  it('agrees with the jury member being in during their boot episode', async () => {
    const result = await getTribeMembers(1, 4);
    expect(result[3]?.sort()).toEqual([3, 5, 6]);
  });
});
