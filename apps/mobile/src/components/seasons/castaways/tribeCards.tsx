import { View, Text } from 'react-native';
import { type Tribe } from '~/types/tribes';
import ColorRow from '~/components/shared/colorRow';

interface TribeCardsProps {
  tribes: Tribe[];
}

export default function TribeCards({ tribes }: TribeCardsProps) {
  return (
    <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20 px-4 pt-4 pb-3'>
      {/* Header */}
      <View className='mb-2 w-full flex-row items-center gap-2'>
        <View className='h-5 w-0.5 rounded-full bg-primary' />
        <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
          Tribes
        </Text>
      </View>

      {/* Tribe Chips */}
      <View className='flex-row gap-2 w-full'>
        {tribes.map((tribe) => (
          <ColorRow
            key={tribe.tribeId}
            color={tribe.tribeColor}
            className='flex-1'>
            <Text className='font-bold'>
              {tribe.tribeName}
            </Text>
          </ColorRow>
        ))}
      </View>
    </View>
  );
}
