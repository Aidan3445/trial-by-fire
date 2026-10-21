import { Text, View } from 'react-native';
import { cn } from '~/lib/utils';
import { type FundingGoal } from '~/types/funding';

const dollars = (value: number) => `$${Number.isInteger(value) ? value : value.toFixed(2)}`;

/**
 * Progress toward each funding goal
 */
export default function FundingTracker({ goals }: { goals: FundingGoal[] }) {
  return (
    <View className='gap-2'>
      {goals.map((goal) => {
        const percent = goal.goal > 0 ? Math.min(100, (goal.coverage / goal.goal) * 100) : 100;
        return (
          <View key={goal.fundingId} className='gap-1'>
            <View className='flex-row items-center justify-between gap-2'>
              <Text className='text-sm font-bold text-foreground'>{goal.name}</Text>
              <Text className={cn('text-sm', goal.fulfilled ? 'font-bold text-positive' : 'text-muted-foreground')}>
                {goal.fulfilled ? 'Covered!' : `${dollars(goal.coverage)} of ${dollars(goal.goal)}`}
              </Text>
            </View>
            <View className='h-2 w-full overflow-hidden rounded-full bg-primary/15'>
              <View
                className={cn('h-full rounded-full', goal.fulfilled ? 'bg-positive' : 'bg-primary')}
                style={{ width: `${percent}%` }} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
