import { Clock } from 'lucide-react-native';
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Modal from '~/components/common/modal';
import { colors } from '~/lib/colors';
import { BaseEventFullName } from '~/lib/events';
import type { PredictionWithEvent, BaseEventName, EventReference } from '~/types/events';
import PointsCell from '~/components/leagues/hub/activity/predictionHistory/pointsCell';

interface PredictionRowProps {
  prediction: PredictionWithEvent;
  hasBets: boolean;
  findReferenceNames: (_references?: EventReference[]) => { short: string; full: string; }[];
  previousEpisodeNumber: number;
}

export default function PredictionRow({
  prediction: pred,
  hasBets,
  findReferenceNames,
  previousEpisodeNumber,
}: PredictionRowProps) {
  const [showTimingModal, setShowTimingModal] = useState(false);

  const eventName = BaseEventFullName[pred.eventName as BaseEventName] ?? pred.eventName;
  const predictionRefs = findReferenceNames([{ type: pred.referenceType, id: pred.referenceId }]);
  const resultRefs = findReferenceNames(pred.event?.references);

  const isWeekly = pred.timing.every((t) => t.includes('Weekly'));
  const showNoResult =
    isWeekly && previousEpisodeNumber >= pred.predictionEpisodeNumber && !pred.event;

  const differentEpisode = pred.eventEpisodeNumber !== null
    && pred.eventEpisodeNumber !== pred.predictionEpisodeNumber;

  return (
    <>
      <View className='flex-row items-center border-b border-primary/10 px-2 py-2 gap-1'>
        {/* Event Name + Timing */}
        <Pressable
          onPress={() => setShowTimingModal(true)}
          className='flex-1 flex-row items-center gap-1 active:opacity-70'>
          <Clock size={14} color={colors.primary} />
          <Text className='text-base font-medium text-foreground' numberOfLines={1}>
            {differentEpisode && (
              <Text className='text-sm font-semibold text-primary'>
                {pred.eventEpisodeNumber}{': '}
              </Text>
            )}
            {eventName}
          </Text>
        </Pressable>

        {/* Points */}
        <PointsCell points={pred.points} hit={pred.hit} neutral={!pred.hit} />

        {/* Bet */}
        {hasBets && (
          pred.bet && pred.bet > 0 ? (
            <PointsCell
              points={pred.bet * (pred.hit ? 1 : -1)}
              hit={pred.hit}
              neutral={!pred.eventId}
            />
          ) : (
            <Text className='w-12 text-base text-center text-muted-foreground'>-</Text>
          )
        )}

        {/* Prediction */}
        <Text className='w-20 text-base font-medium text-foreground text-left' numberOfLines={1}>
          {predictionRefs.map((r) => r.short).join(', ')}
        </Text>

        {/* Result */}
        <Text className='w-20 text-base font-medium text-foreground text-left' numberOfLines={1}>
          {showNoResult ? '--' : resultRefs.map((r) => r.short).join(', ')}
        </Text>
      </View>

      {/* Timing Modal */}
      <Modal visible={showTimingModal} onClose={() => setShowTimingModal(false)}>
        <View className='gap-3'>
          <View className='flex-row items-center justify-center gap-2'>
            <Clock size={20} color={colors.primary} />
            <Text className='text-base font-bold uppercase tracking-wider text-foreground'>
              Prediction Timing
            </Text>
          </View>
          <View className='h-px bg-primary/20' />
          <View className='gap-1'>
            {pred.timing.map((t, i) => (
              <Text key={i} className='text-base text-foreground text-center'>
                {t}
              </Text>
            ))}
          </View>

          {differentEpisode && (
            <>
              <View className='h-px bg-primary/20' />
              <View className='gap-1'>
                <Text className='text-base text-foreground text-center'>
                  Predicted episode {pred.predictionEpisodeNumber}
                </Text>
                <Text className='text-base text-foreground text-center'>
                  Resolved episode {pred.eventEpisodeNumber}
                </Text>
              </View>
            </>
          )}

          <Pressable
            onPress={() => setShowTimingModal(false)}
            className='rounded-lg bg-primary p-3 active:opacity-80'>
            <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
              Got it
            </Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
