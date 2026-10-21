// Re-export all shared utility exports
export * from '@survivor/lib';

// Web-only function
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
  const asUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour), Number(p.minute), Number(p.second)
  );
  return asUtc - utcMs; // negative, e.g. -4h or -5h
}

/**
 * The calendar date a string names, as [year, month (1-12), day].
 * Takes 'YYYY-MM-DD' (or 'YYYY-M-D') and written dates like 'September 24, 2025',
 * ignoring wiki footnote markers such as '[1]'.
 */
function calendarDate(dateStr: string): [number, number, number] | null {
  const text = dateStr.replace(/\[[^\]]*\]/g, '').trim();
  if (!text) return null;

  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(text);
  if (iso) return [+iso[1]!, +iso[2]!, +iso[3]!];

  // Without a time or zone, a written date parses as local midnight, so its local fields are the date it names
  if (/^\d/.test(text)) return null;
  const parsed = new Date(text);
  if (isNaN(parsed.getTime())) return null;
  return [parsed.getFullYear(), parsed.getMonth() + 1, parsed.getDate()];
}

export function setToNY8PM(dateStr: string): Date | null {
  const date = calendarDate(dateStr);
  if (!date) return null;
  const [y, mo, d] = date;

  // Date.UTC rolls 2024-02-31 over to March, so reject days the month doesn't have
  const day = new Date(Date.UTC(y, mo - 1, d));
  if (day.getUTCFullYear() !== y || day.getUTCMonth() !== mo - 1 || day.getUTCDate() !== d) return null;

  // Treat 8pm as if it were UTC, then correct by NY's offset.
  const guess = Date.UTC(y, mo - 1, d, 20, 0, 0);
  let result = guess - nyOffsetMs(guess);
  // Re-check in case the offset differs at the corrected instant (DST transition days)
  result = guess - nyOffsetMs(result);

  const out = new Date(result);
  return isNaN(out.getTime()) ? null : out;
}
