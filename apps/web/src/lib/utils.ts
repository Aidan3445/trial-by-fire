// Re-export all shared utility exports
export * from '@survivor/lib';

// Web-only function
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'long'
});

const nyParts = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  hourCycle: 'h23',
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
});

// Offset (ms) of NY relative to UTC at a given instant
function nyOffsetMs(utcMs: number): number {
  const p = Object.fromEntries(
    nyParts.formatToParts(new Date(utcMs)).map(({ type, value }) => [type, value])
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return asUtc - utcMs; // negative, e.g. -4h or -5h
}

export function setToNY8PM(dateStr: string): Date | null {
  // Expects 'YYYY-MM-DD'
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return null;
  const [, y, mo, d] = m.map(Number) as unknown as number[];

  // Treat 8pm as if it were UTC, then correct by NY's offset.
  const guess = Date.UTC(y, mo - 1, d, 20, 0, 0);
  let result = guess - nyOffsetMs(guess);
  // Re-check in case the offset differs at the corrected instant (DST transition days)
  result = guess - nyOffsetMs(result);

  const out = new Date(result);
  return isNaN(out.getTime()) ? null : out;
}