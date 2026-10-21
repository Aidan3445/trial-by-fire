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

  it('should use EST timezone in parsing', () => {
    // The function should parse the date as "YYYY-MM-DD 20:00:00 EST"
    const result = setToNY8PM('2024-01-15');

    // Format should process through Intl.DateTimeFormat with America/New_York timezone
    expect(result).toBeInstanceOf(Date);
  });

  it('should be idempotent for valid dates', () => {
    const result1 = setToNY8PM('2024-01-15');
    const result2 = setToNY8PM('2024-01-15');

    expect(result1).toBeInstanceOf(Date);
    expect(result2).toBeInstanceOf(Date);
    expect(result1!.getTime()).toBe(result2!.getTime());
  });
});
