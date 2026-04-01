import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Circle } from 'lucide-react-native';
import { type Tribe } from '~/types/tribes';
import Modal from '~/components/common/modal';

interface TribeHistoryCirclesProps {
  tribeTimeline: Array<{ episode: number; tribe: Tribe | null }>;
}

export default function TribeHistoryCircles({ tribeTimeline }: TribeHistoryCirclesProps) {
  const [modalVisible, setModalVisible] = useState(false);

  // Filter out null tribes
  const validTimeline = tribeTimeline.filter(
    (item): item is { episode: number; tribe: Tribe } => item.tribe !== null
  );

  if (validTimeline.length === 0) return null;

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        className='ml-auto flex-row gap-0.5 active:opacity-60'>
        {validTimeline.map(({ episode, tribe }) => (
          <Circle
            key={`${tribe.tribeName}-${episode}`}
            size={16}
            fill={tribe.tribeColor}
            stroke='black'
            color={tribe.tribeColor}
          />
        ))}
      </Pressable>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        {/* Header */}
        <View className='mb-3 flex-row items-center gap-2'>
          <View className='h-5 w-1 rounded-full bg-primary' />
          <Text className='text-lg font-bold text-foreground'>Tribe History</Text>
        </View>

        {/* Timeline */}
        <View className='gap-2'>
          {validTimeline.map(({ episode, tribe }, index) => (
            <View
              key={`${tribe.tribeName}-${episode}`}
              className='flex-row items-center gap-3 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2'>
              {/* Episode Badge */}
              <View className='items-center justify-center rounded-md bg-primary/20 px-2 py-1'>
                <Text className='text-xs font-bold text-primary'>Ep {episode}</Text>
              </View>

              {/* Tribe Color Circle */}
              <Circle size={20} fill={tribe.tribeColor} stroke='black' color={tribe.tribeColor} />

              {/* Tribe Name */}
              <Text className='flex-1 font-semibold text-foreground'>{tribe.tribeName}</Text>

              {/* Current indicator */}
              {index === validTimeline.length - 1 && (
                <View className='rounded-full bg-green-500/20 px-2 py-0.5'>
                  <Text className='text-xs font-bold text-green-600'>Current</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </Modal>
    </>
  );
}
