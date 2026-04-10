import { View, Text } from 'react-native';
import { useMemo } from 'react';
import { cn } from '~/lib/utils';
import { type EnrichedEvent, type BaseEventName } from '~/types/events';
import { BaseEventFullName } from '~/lib/events';
import EditEvent from '~/components/leagues/actions/events/edit';
import { useEventLabel } from '~/hooks/helpers/useEventLabel';

interface StickyCellProps {
  event: EnrichedEvent;
  seasonId?: number;
  edit?: boolean;
  isMock?: boolean;
  className?: string;
}

export default function StickyCell({
  event,
  seasonId,
  edit,
  isMock,
  className,
}: StickyCellProps) {
  const isBaseEvent = useMemo(() => event.eventSource === 'Base', [event.eventSource]);
  const label = useEventLabel(event.eventName, isBaseEvent, event.label);
  return (
    <View className={cn('h-full flex-row items-center gap-4 border-b border-primary/10 pl-4', className ?? 'bg-card')}>
      {edit && (
        isMock ? (
          <View className='w-8' />
        ) : (
          <View className='w-8'>
            <EditEvent event={event} overrideSeasonId={seasonId} />
          </View>
        ))}
      <View className='w-40 h-full flex-row border-r border-secondary'>
        <View className='py-2 flex-1 justify-center pr-0.5'>
          {isBaseEvent && (
            <Text className='text-xs text-muted-foreground'>
              {BaseEventFullName[event.eventName as BaseEventName]}
            </Text>
          )}
          {label.split('#/').map((part, index) => (
            <Text key={index} className='text-base text-foreground'>{part}</Text>
          ))}
        </View>
      </View>
    </View>
  );
}
