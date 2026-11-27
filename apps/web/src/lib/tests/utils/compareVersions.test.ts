import { describe, expect, it } from 'vitest';
import { compareVersions, isOlderThan } from '~/lib/utils';

describe('compareVersions', () => {
  it('orders by each part numerically', () => {
    expect(compareVersions('2.1.0', '2.0.9')).toBeGreaterThan(0);
    expect(compareVersions('2.0.10', '2.0.9')).toBeGreaterThan(0);
    expect(compareVersions('1.9.9', '2.0.0')).toBeLessThan(0);
  });

  it('treats missing parts as zero', () => {
    expect(compareVersions('2.1', '2.1.0')).toBe(0);
    expect(compareVersions('2', '2.0.1')).toBeLessThan(0);
  });
});

describe('isOlderThan', () => {
  it('is true only below the minimum', () => {
    expect(isOlderThan('2.0.9', '2.1.0')).toBe(true);
    expect(isOlderThan('2.1.0', '2.1.0')).toBe(false);
    expect(isOlderThan('2.2.0', '2.1.0')).toBe(false);
  });

  it('never blocks without a version or a minimum', () => {
    expect(isOlderThan(null, '2.1.0')).toBe(false);
    expect(isOlderThan('2.0.0', null)).toBe(false);
    expect(isOlderThan('2.0.0', '')).toBe(false);
  });
});
