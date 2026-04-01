import { Text, View } from 'react-native';
import { cn } from '~/lib/utils';

interface PointsCellProps {
  points: number;
  hit?: boolean | null;
  neutral?: boolean;
}

export default function PointsCell({ points, hit, neutral }: PointsCellProps) {
  if (neutral) {
    return (
      <Text className='w-12 text-sm font-medium text-muted-foreground text-center'>
        {points}
      </Text>
    );
  }

  return (
    <View className='w-12 flex-row items-center justify-center gap-0.5'>
      <Text
        className={cn(
          'text-sm font-medium',
          hit ? 'text-positive' : 'text-destructive'
        )}>
        {points > 0 && hit ? '+' : ''}{points}
      </Text>
    </View>
  );
}
