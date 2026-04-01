// Re-export all shared utility exports
export * from '@survivor/lib';

// Web-only function
const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York',
  dateStyle: 'medium',
  timeStyle: 'long'
});

export function setToNY8PM(dateStr: string): Date | null {
  try {
    const date = new Date(`${dateStr} 20:00:00 EST`);
    if (isNaN(date.getTime())) return null;
    return new Date(fmt.format(date));
  } catch {
    return null;
  }
}
