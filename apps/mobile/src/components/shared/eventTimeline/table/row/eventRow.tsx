import { View, Text } from 'react-native';
import { type ReactNode, useMemo, useState } from 'react';
import { cn } from '~/lib/utils';
import ColorRow from '~/components/shared/colorRow';
import PointsCell from '~/components/shared/eventTimeline/table/row/pointsCell';
import NotesCell from '~/components/shared/eventTimeline/table/row/notesCell';
import { type EnrichedEvent, type BaseEventName } from '~/types/events';
import { BaseEventFullName } from '~/lib/events';
import EditEvent from '~/components/leagues/actions/events/edit';
import { useEventLabel } from '~/hooks/helpers/useEventLabel';
import CastawayModal from '~/components/shared/castaways/castawayModal';
import Modal from '~/components/common/modal';
import MarqueeText from '~/components/common/marquee';
import Button from '~/components/common/button';

interface EventRowProps {
  className?: string;
  event: EnrichedEvent;
  seasonId?: number;
  editCol?: boolean;
  isMock?: boolean;
  noTribes?: boolean;
  noMembers?: boolean;
  noPoints?: boolean;
  onRowLayout?: (_id: string, _y: number, _height: number, _node: ReactNode) => void;
}

export default function EventRow({
  className,
  event,
  seasonId,
  editCol: edit,
  isMock,
  noTribes,
  noMembers,
  noPoints,
  onRowLayout,
}: EventRowProps) {
  const isBaseEvent = useMemo(() => event.eventSource === 'Base', [event.eventSource]);
  const label = useEventLabel(event.eventName, isBaseEvent, event.label);

  const [secondaryModalVisible, setSecondaryModalVisible] = useState(false);
  const [secondaryModalMembers, setSecondaryModalMembers] = useState<
    Array<{ memberId: number; displayName: string; color: string }>
  >([]);

  const openSecondaryModal = (
    secondaries: Array<{ memberId: number; displayName: string; color: string }>
  ) => {
    setSecondaryModalMembers(secondaries);
    setSecondaryModalVisible(true);
  };

  // Sticky overlay cell — rendered outside the ScrollView by EpisodeScrollContainer.
  // Uses h-full so it fills the measured height the container provides.
  const stickyCell = useMemo<ReactNode>(() => (
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
  ), [className, edit, isMock, event, seasonId, isBaseEvent, label]);

  return (
    <View
      className={cn('flex-row items-center gap-4 border-b border-primary/10 bg-card px-4 py-2', className)}
      onLayout={(e) => {
        const { y, height } = e.nativeEvent.layout;
        onRowLayout?.(`event-${event.eventId}`, y, height, stickyCell);
      }}>
      {/* Edit Column */}
      {edit ? (
        isMock ? (
          <View className='w-8' />
        ) : (
          <View className='w-8'>
            <EditEvent event={event} overrideSeasonId={seasonId} />
          </View>
        )
      ) : null}

      {/* Event Name */}
      <View className='w-40 h-full'>
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


      {/* Points */}
      {!noPoints && <PointsCell points={event.points} />}

      {/* Tribes */}
      {!noTribes && (
        <View className='w-24 justify-center gap-0.5'>
          {event.referenceMap?.map(({ tribe }, index) =>
            tribe ? (
              <ColorRow key={index} className='leading-tight' color={tribe.tribeColor}>
                <Text className='text-base text-foreground font-medium'>
                  {tribe.tribeName}
                </Text>
              </ColorRow>
            ) : null
          )}
        </View>
      )}

      {/* Castaways */}
      <View className='w-32 items-end justify-center gap-0.5'>
        {event.referenceMap?.map(({ pairs }) =>
          pairs.map(({ castaway }) => (
            <CastawayModal key={castaway.castawayId} castaway={castaway}>
              <ColorRow
                className='leading-tight'
                color={castaway.tribe?.color ?? '#AAAAAA'}>
                <MarqueeText
                  marqueeThreshold={0}
                  text={castaway.shortName}
                  className='text-base text-foreground font-medium' />
              </ColorRow>
            </CastawayModal>
          ))
        )}
      </View>

      {/* Members */}
      {!noMembers && (
        <View className='w-36 justify-center gap-0.5'>
          {event.referenceMap?.map(({ pairs }, index) =>
            pairs.map(({ castaway, member, secondaries }) => (
              <View
                key={`${castaway.castawayId}-${index}`}
                className='flex-row items-center gap-1'>
                {member ? (
                  <ColorRow className='leading-tight' color={member.color}>
                    <MarqueeText
                      marqueeThreshold={0}
                      text={member.displayName}
                      className={cn(
                        'text-base transition-all text-black font-medium',
                        member.loggedIn && 'text-primary'
                      )}
                      containerClassName='flex-row' />
                  </ColorRow>
                ) : (
                  <ColorRow
                    color='#CCCCCC'
                    className={cn(
                      'leading-tight text-muted-foreground',
                      (secondaries?.length === 0 || !event.points) && 'opacity-0'
                    )}>
                    <Text className='text-base text-foreground font-medium'>
                      None
                    </Text>
                  </ColorRow>
                )}
                {secondaries && secondaries.length > 0 && !!event.points && (
                  <Button
                    onPress={() => openSecondaryModal(secondaries)}
                    className='rounded border border-primary/20 px-1'>
                    <Text className='text-xs text-muted-foreground font-medium'>
                      2<Text className='text-[10px] font-medium'>nd</Text>
                    </Text>
                  </Button>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* Notes */}
      <NotesCell notes={event.notes} />

      {/* Secondary Picks Modal */}
      <Modal visible={secondaryModalVisible} onClose={() => setSecondaryModalVisible(false)}>
        <Text className='text-center text-lg font-semibold uppercase tracking-wide'>
          Secondary Points
        </Text>
        <View className='mt-2 gap-1'>
          {secondaryModalMembers.map((secMember) => (
            <ColorRow
              key={`secondary-${secMember.memberId}`}
              className='leading-tight'
              color={secMember.color}>
              <Text className='text-lg font-medium text-foreground ml-1'>
                {secMember.displayName}
              </Text>
            </ColorRow>
          ))}
        </View>
      </Modal>
    </View>
  );
}
