import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { PointsIcon } from '~/components/icons/generated';

interface PointsCellProps {
  points: number | null;
  neutral?: boolean;
  className?: string;
}

export default function PointsCell({ points, neutral, className }: PointsCellProps) {
  return (
    <View className={cn('w-16 items-center justify-center', className)}>
      <ColoredPoints points={points} neutral={neutral} />
    </View>
  );
}

export function ColoredPoints({ points, neutral }: PointsCellProps) {
  if (!points) return null;

  const color = neutral ? '#6b7280' : points > 0 ? '#15803d' : '#dc2626';

  return (
    <View className='flex-row items-center justify-center'>
      <Text
        className={cn(
          'text-center text-sm font-semibold',
          neutral
            ? 'text-muted-foreground'
            : points > 0
              ? 'text-green-700'
              : 'text-destructive'
        )}>
        {points < 0 || neutral ? points : `+${points}`}
      </Text>
      <View style={{ marginTop: -2 }}>
        <PointsIcon size={12} color={color} />
      </View>
    </View>
  );
}
