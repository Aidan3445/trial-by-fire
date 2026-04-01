import { View, Text } from 'react-native';
import Button from '~/components/common/button';
import { type UseFormReturn } from 'react-hook-form';
import { type CustomEventRuleInsert } from '~/types/leagues';
import CustomEventFields from '~/components/leagues/customization/events/custom/fields';
import Modal from '~/components/common/modal';

interface CustomEventModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  reactForm: UseFormReturn<CustomEventRuleInsert>;
  type: 'Create' | 'Edit';
}

export default function CustomEventModal({
  isVisible,
  onClose,
  onSubmit,
  reactForm,
  type
}: CustomEventModalProps) {
  return (
    <Modal visible={isVisible} onClose={onClose}>
      {/* Header */}
      <View className='flex-row items-center gap-1 mb-4'>
        <View className='h-6 w-1 bg-primary rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight'>
          {type} Custom Event
        </Text>
      </View>

      {/* Fields */}
      <CustomEventFields
        reactForm={reactForm}
        predictionDefault={reactForm.watch('eventType') === 'Prediction'} />

      {/* Action Buttons */}
      <View className='flex-row gap-2 mt-4'>
        <Button
          className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
          onPress={onClose}>
          <Text className='text-center font-semibold text-white'>Cancel</Text>
        </Button>
        <Button
          className='flex-1 rounded-lg bg-primary p-3 active:opacity-80'
          disabled={!reactForm.formState.isValid}
          onPress={onSubmit}>
          <Text className='text-center font-semibold text-white'>
            {type} Event
          </Text>
        </Button>
      </View>
    </Modal>
  );
}
