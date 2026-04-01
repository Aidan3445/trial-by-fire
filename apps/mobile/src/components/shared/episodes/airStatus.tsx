import { View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { type AirStatus as EpAirStatus } from '~/types/episodes';

type AirStatusProps = {
  airDate: Date;
  airStatus: EpAirStatus;
  showDate?: boolean;
  showTime?: boolean;
};

export default function AirStatus({
  airDate,
  airStatus,
  showDate = true,
  showTime = true,
}: AirStatusProps) {
  return (
    <View className='flex-row items-center gap-1'>
      {showDate && (
        <Text className='text-sm text-muted-foreground'>
          {showTime
            ? airDate.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })
            : airDate.toLocaleDateString()}
        </Text>
      )}
      <View
        className={cn(
          'rounded-md px-1',
          airStatus === 'Aired' && 'bg-destructive',
          airStatus === 'Upcoming' && 'bg-amber-500',
          airStatus === 'Airing' && 'bg-green-600'
        )}>
        <Text className='text-xs text-white font-medium leading-none py-0.5'>{airStatus}</Text>
      </View>
    </View>
  );
}
