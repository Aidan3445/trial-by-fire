'use client';

import { Text, View } from 'react-native';
import Modal from '~/components/common/modal';
import { useDraftDate } from '~/hooks/leagues/mutation/useDraftDate';
import Button from '~/components/common/button';
import DraftDate from '~/components/leagues/actions/create/draftDate';
import { useState } from 'react';
import { colors } from '~/lib/colors';
import { Lock, Unlock } from 'lucide-react-native';

interface SetDraftDateProps {
  onDraftJoin?: () => void;
  overrideHash?: string;
}

export default function SetDraftDate({ onDraftJoin, overrideHash }: SetDraftDateProps) {
  const { reactForm, handleSubmit, resetForm } = useDraftDate(overrideHash, () => setModalOpen(false));
  const [modalOpen, setModalOpen] = useState(false);

  const handleCancel = () => {
    resetForm();
    setModalOpen(false);
  };

  return (
    <>
      <Button onPress={() => setModalOpen(true)}>
        {modalOpen ? (
          <Unlock size={24} color={colors.secondary} />
        ) : (
          <Lock size={24} color={colors.primary} />
        )}
      </Button>
      <Modal
        visible={modalOpen}
        onClose={handleCancel}>
        <View className='w-full rounded-xl bg-card gap-2'>
          <Text className='text-card-foreground text-center text-lg font-bold'>Set Draft Date</Text>
          <DraftDate control={reactForm.control} editing onDraftJoin={onDraftJoin} />
          <View className='flex-row justify-between gap-3'>
            <Button
              onPress={() => handleCancel()}
              className='flex-1 rounded-lg bg-destructive px-4 py-3'>
              <Text className='text-center font-medium text-white'>Cancel</Text>
            </Button>
            <Button
              onPress={() => handleSubmit()}
              className='flex-1 rounded-lg bg-primary px-4 py-3 disabled:opacity-50'
              disabled={!reactForm.formState.isDirty}>
              <Text className='text-center font-medium text-white'>Save</Text>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
