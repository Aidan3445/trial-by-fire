export * from '@survivor/lib';
// Re-exports from @survivor/lib: twentyColors, twentyFourColors

// Mobile-only exports below:

import tailwindConfig from '@/tailwind.config.cjs';
export const colors = tailwindConfig.theme!.extend!.colors! as Record<string, string>;

export const getPointsColor = (currentValue: number) => {
  if (currentValue === 0) return colors.neutral;
  return currentValue > 0 ? colors.positive : colors.destructive;
};

export const rankBadgeColor = (place: number) =>
  place === 1
    ? '#F0B100'
    : place === 2
      ? '#99A0AE'
      : place === 3
        ? '#BB4D00'
        : '#674428';
export const rankTextColor = (place: number) =>
  place === 1
    ? 'text-yellow-600'
    : place === 2
      ? 'text-gray-500'
      : place === 3
        ? 'text-amber-900'
        : 'text-primary';
