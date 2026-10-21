import { describe, it, expect } from 'vitest';
import { setToNY8PM } from '~/lib/utils';

describe('setToNY8PM', () => {
  it('should parse valid date string to NY 8PM', () => {
    const result = setToNY8PM('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect(result!.toString()).toContain('2024');
  });

  it('should handle date strings in various formats', () => {
    const result1 = setToNY8PM('2024-01-15');
    const result2 = setToNY8PM('2024-1-15');

    expect(result1).toBeInstanceOf(Date);
    expect(result2).toBeInstanceOf(Date);
  });

  it('should return null for invalid date strings', () => {
    const result = setToNY8PM('invalid-date');

    expect(result).toBeNull();
  });

  it('should return null for empty date string', () => {
    const result = setToNY8PM('');

    expect(result).toBeNull();
  });

  it('should be 8pm New York time, EST in winter and EDT in summer', () => {
    expect(setToNY8PM('2024-01-15')!.toISOString()).toBe('2024-01-16T01:00:00.000Z');
    expect(setToNY8PM('2025-09-24')!.toISOString()).toBe('2025-09-25T00:00:00.000Z');
  });

  it('should use the right offset on daylight saving changeover days', () => {
    expect(setToNY8PM('2025-03-09')!.toISOString()).toBe('2025-03-10T00:00:00.000Z');
    expect(setToNY8PM('2025-11-02')!.toISOString()).toBe('2025-11-03T01:00:00.000Z');
  });

  it('should parse written dates like the wiki uses', () => {
    const iso = setToNY8PM('2025-09-24')!.getTime();
    expect(setToNY8PM('September 24, 2025')!.getTime()).toBe(iso);
    expect(setToNY8PM('Sep 24, 2025')!.getTime()).toBe(iso);
    expect(setToNY8PM('September 24, 2025[1]')!.getTime()).toBe(iso);
  });

  it('should treat unpadded months and days like padded ones', () => {
    expect(setToNY8PM('2024-1-5')!.getTime()).toBe(setToNY8PM('2024-01-05')!.getTime());
  });

  it('should return null for days the month does not have', () => {
    expect(setToNY8PM('2024-02-31')).toBeNull();
    expect(setToNY8PM('2024-13-01')).toBeNull();
  });

  it('should be idempotent for valid dates', () => {
    const result1 = setToNY8PM('2024-01-15');
    const result2 = setToNY8PM('2024-01-15');

    expect(result1).toBeInstanceOf(Date);
    expect(result2).toBeInstanceOf(Date);
    expect(result1!.getTime()).toBe(result2!.getTime());
  });
});
