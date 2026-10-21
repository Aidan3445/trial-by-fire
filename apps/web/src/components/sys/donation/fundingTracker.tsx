import { cn } from '~/lib/utils';
import { type FundingGoal } from '~/types/funding';

const dollars = (value: number) => `$${Number.isInteger(value) ? value : value.toFixed(2)}`;

/**
  * Progress toward each funding goal
  */
export default function FundingTracker({ goals, className }: { goals: FundingGoal[]; className?: string }) {
  return (
    <ul className={cn('flex flex-col gap-2', className)}>
      {goals.map((goal) => {
        const percent = goal.goal > 0 ? Math.min(100, (goal.coverage / goal.goal) * 100) : 100;
        return (
          <li key={goal.fundingId} className='flex flex-col gap-1'>
            <span className='flex items-center justify-between gap-2 text-sm'>
              <span className='font-bold'>{goal.name}</span>
              <span className={cn('tabular-nums', goal.fulfilled ? 'text-green-700 font-bold' : 'text-muted-foreground')}>
                {goal.fulfilled ? 'Covered!' : `${dollars(goal.coverage)} of ${dollars(goal.goal)}`}
              </span>
            </span>
            <span className='h-2 w-full overflow-hidden rounded-full bg-primary/15'>
              <span
                className={cn('block h-full rounded-full transition-all', goal.fulfilled ? 'bg-green-600' : 'bg-primary')}
                style={{ width: `${percent}%` }} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
