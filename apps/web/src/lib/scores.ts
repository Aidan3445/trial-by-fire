// Re-export all shared score lib exports
export * from '@survivor/lib';

// Web-only function
export const rankBadgeColor = (place: number) =>
  place === 1
    ? 'fill-yellow-500 text-yellow-600 shadow-yellow-500/40'
    : place === 2
      ? 'fill-gray-400 text-gray-600 shadow-gray-400/40'
      : place === 3
        ? 'fill-amber-700 text-amber-700 shadow-amber-700/40'
        : 'fill-primary text-primary';
