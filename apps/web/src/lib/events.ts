// Re-export all shared event lib exports
export * from '@survivor/lib';

// Web-only function
export function eventSortOrder(eventName: string): number {
  if (eventName === 'tribeUpdate' || eventName === 'redemption') return 0;
  if (eventName === 'elim' || eventName === 'noVoteExit') return 2;
  if (eventName === 'otherNotes') return 3;

  return 1;
}
