import { useState } from 'react';
import { View, Text, TextInput, Pressable, Alert } from 'react-native';
import { Controller } from 'react-hook-form';
import { Pencil, X } from 'lucide-react-native';
import { useEditEvent } from '~/hooks/shared/mutation/useEditEvent';
import { cn } from '~/lib/utils';
import MultiSelect from '~/components/common/searchableMultiSelect';
import type { EnrichedEvent, EventReference } from '~/types/events';
import { colors } from '~/lib/colors';
import Modal from '~/components/common/modal';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';

interface EditEventModalProps {
  event: EnrichedEvent;
  overrideSeasonId?: number;
}

export default function EditEvent({ event, overrideSeasonId }: EditEventModalProps) {
  const userId = useSysAdmin();

  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);


  const {
    form,
    clearKey,
    combinedReferenceOptions,
    handleCombinedReferenceSelection,
    getDefaultStringValues,
    handleUpdate,
    handleDelete,
    isUpdating,
    isDeleting,
  } = useEditEvent(event, overrideSeasonId);

  if (!userId && event.eventSource === 'Base') return null;

  const onUpdate = () => {
    void handleUpdate();
    setIsOpen(false);
  };

  const onDelete = () => {
    void (async () => {
      const result = await handleDelete();
      if (result?.success) {
        setShowDeleteConfirm(false);
        // wait to close edit modal until after alert
        Alert.alert('Success', 'Event deleted successfully.', [
          {
            text: 'OK',
            onPress: () => setIsOpen(false),
          },
        ]);
      } else {
        Alert.alert('Error', 'Failed to delete event');
      }
    })();
  };

  return (
    <>
      {/* Trigger */}
      <Pressable onPress={() => setIsOpen(true)} className='p-1 active:opacity-80'>
        <Pencil size={20} color={colors.mutedForeground} />
      </Pressable>

      {/* Edit Modal */}
      <Modal
        visible={isOpen}
        onClose={() => setIsOpen(false)}>
        {/* Header */}
        <View className='flex-row items-center justify-between px-1'>
          <View className='flex-row items-center gap-2'>
            <View className='h-6 w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              Edit {event.eventName}
            </Text>
          </View>
          <Pressable onPress={() => setIsOpen(false)} className='p-1 active:opacity-80'>
            <X size={24} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Label Input */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Event Label
          </Text>
          <Controller
            control={form.control}
            name='label'
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className='w-full flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10'
                placeholder='Label'
                placeholderTextColor={colors.primary}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                returnKeyType='done' />
            )}
          />
        </View>

        {/* References MultiSelect */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            References
          </Text>
          <Controller
            control={form.control}
            name='references'
            render={({ field: { value } }) => (
              <MultiSelect
                key={clearKey}
                options={combinedReferenceOptions}
                onToggleSelect={(values) =>
                  form.setValue('references', handleCombinedReferenceSelection(values))
                }
                selectedValues={getDefaultStringValues(value as EventReference[])}
                placeholder='Select References'
              />
            )}
          />
        </View>

        {/* Notes Input */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Notes (line separated)
          </Text>
          <Controller
            control={form.control}
            name='notes'
            render={({ field: { value } }) => (
              <TextInput
                className='rounded-lg border-2 border-primary/20 bg-card px-2 py-2 text-base text-foreground min-h-20'
                placeholder='Notes'
                placeholderTextColor={colors.primary}
                value={(value as string[])?.join('\n') ?? ''}
                onChangeText={(text) => form.setValue('notes', text.split('\n'))}
                multiline
                textAlignVertical='top'
                returnKeyType='default' />
            )} />
        </View>

        {/* Footer Buttons */}
        <View className='flex-row items-center justify-between pt-2'>
          {/* Delete Button */}
          <Pressable
            onPress={() => setShowDeleteConfirm(true)}
            className='rounded-lg bg-destructive px-3 py-2 active:opacity-80'>
            <Text className='text-base font-bold uppercase tracking-wider text-white'>
              Delete
            </Text>
          </Pressable>

          {/* Cancel / Save */}
          <View className='flex-row gap-2'>
            <Pressable
              onPress={() => setIsOpen(false)}
              className='rounded-lg border-2 border-primary/20 bg-card px-3 py-2 active:opacity-80'>
              <Text className='text-base font-bold uppercase tracking-wider text-foreground'>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onUpdate}
              disabled={isUpdating}
              className={cn(
                'rounded-lg bg-primary px-3 py-2 active:opacity-80 justify-center items-center',
                isUpdating && 'opacity-50'
              )}>
              <Text className='text-base font-bold uppercase tracking-wider text-white'>
                {isUpdating ? 'Saving...' : 'Save'}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Delete Confirmation Modal */}
        <Modal
          visible={showDeleteConfirm && isOpen}
          onClose={() => setShowDeleteConfirm(false)}>
          {/* Destructive Header */}
          <View className='h-1 w-12 rounded-full bg-destructive self-center' />

          <Text className='text-xl font-black uppercase tracking-tight text-destructive text-center'>
            Delete Event
          </Text>
          <Text className='text-base text-muted-foreground text-center'>
            Are you sure you want to delete this event? This action cannot be undone.
          </Text>

          <View className='flex-row gap-2 pt-2'>
            <Pressable
              onPress={() => setShowDeleteConfirm(false)}
              className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-foreground'>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              disabled={isDeleting}
              className={cn(
                'flex-1 rounded-lg bg-destructive p-3 active:opacity-80',
                isDeleting && 'opacity-50'
              )}>
              <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </Modal>

      </Modal>
    </>
  );
}
