import { useState } from 'react';
import { View, Text, Pressable, type TextLayoutEvent } from 'react-native';
import { Info } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import { colors } from '~/lib/colors';

interface DescriptionCellProps {
  label: string;
  description: string;
}

export default function DescriptionCell({ label, description }: DescriptionCellProps) {
  const [truncated, setTruncated] = useState(false);
  const [measured, setMeasured] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  const handleTextLayout = (e: TextLayoutEvent) => {
    if (!measured) {
      setTruncated(e.nativeEvent.lines.length > 2);
      setMeasured(true);
    }
  };

  return (
    <>
      {/* Invisible measuring text */}
      {!measured && (
        <View className='absolute opacity-0 bg-secondary py-1 px-2 left-0 right-0'>
          <Text
            allowFontScaling={false}
            onTextLayout={handleTextLayout}
            className='text-lg font-medium text-foreground text-left leading-none'>
            {description}
          </Text>
        </View>
      )}

      {/* Visible text */}
      <Pressable
        onPress={() => truncated && setModalVisible(true)}
        disabled={!truncated}
        className='bg-secondary py-1 px-2 flex-row items-center gap-1 flex-1'>
        <Text
          allowFontScaling={false}
          numberOfLines={2}
          className='text-lg font-medium text-foreground text-left leading-none flex-1'>
          {description}
        </Text>
        {truncated && <Info size={16} color={colors.mutedForeground} />}
      </Pressable>

      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <View className='rounded-xl border-2 border-primary/20 bg-card p-3 gap-2'>
          <View className='flex-row items-center gap-2'>
            <View className='h-6 w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              {label}
            </Text>
          </View>
          <Text className='text-lg text-foreground'>{description}</Text>
          <Pressable
            onPress={() => setModalVisible(false)}
            className='rounded-lg bg-primary p-3 active:opacity-80'>
            <Text className='text-center font-bold text-primary-foreground'>Close</Text>
          </Pressable>
        </View>
      </Modal>
    </>
  );
}
