import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useClerk } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Trash2 } from 'lucide-react-native';

import Modal from '~/components/common/modal';
import { colors } from '~/lib/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unregisterPushToken } from '~/lib/notifications';
import { useFetch } from '~/hooks/helpers/useFetch';

export default function DeleteAccountButton() {
  const { user } = useClerk();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteData = useFetch('DELETE');

  const handleDelete = () => {
    void (async () => {
      setIsDeleting(true);
      try {
        await unregisterPushToken(deleteData);
        await user?.delete();
        queryClient.clear();
        await AsyncStorage.clear();
        router.replace('/(auth)/sign-in');
      } catch (err) {
        console.error('Error deleting account:', err);
        Alert.alert('Error', 'Failed to delete account');
      } finally {
        setIsDeleting(false);
        setIsOpen(false);
      }
    })();
  };

  return (
    <>
      <View className='w-full rounded-xl border-2 border-destructive/20 bg-card p-2'>
        <Pressable
          className='flex-row items-center justify-center gap-2 rounded-lg border-2 border-destructive bg-card p-3 active:opacity-80'
          onPress={() => setIsOpen(true)}>
          <Trash2 size={18} color={colors.destructive} />
          <Text className='text-base font-semibold text-destructive'>
            Delete Account
          </Text>
        </Pressable>
      </View>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        <View className='gap-4'>
          {/* Header */}
          <View className='flex-row items-center gap-1'>
            <View className='h-6 w-1 rounded-full bg-destructive' />
            <Text className='text-xl font-black uppercase tracking-tight text-destructive'>
              Delete Account
            </Text>
          </View>

          {/* Content */}
          <Text className='text-base text-muted-foreground'>
            Are you sure you want to delete your account?
            This will not delete leagues you have created, but you will lose access to them.
            This action is irreversible.
          </Text>

          {/* Actions */}
          <View className='flex-row gap-2'>
            <Pressable
              className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'
              onPress={() => setIsOpen(false)}>
              <Text className='text-center font-semibold text-foreground'>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
              disabled={isDeleting}
              onPress={handleDelete}>
              <Text className='text-center font-semibold text-destructive-foreground'>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}
