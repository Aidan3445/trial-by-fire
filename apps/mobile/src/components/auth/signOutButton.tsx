import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { useClerk } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { LogOut } from 'lucide-react-native';
import { colors } from '~/lib/colors';
import { useFetch } from '~/hooks/helpers/useFetch';
import { unregisterPushToken } from '~/lib/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SignOutButton() {
  const { signOut } = useClerk();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const deleteData = useFetch('DELETE');

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            setIsSigningOut(true);
            try {
              await unregisterPushToken(deleteData);
              queryClient.clear();
              await AsyncStorage.clear();
              await signOut();
              router.replace('/(auth)/sign-in');
            } catch (err) {
              console.error(JSON.stringify(err, null, 2));
              Alert.alert('Error', 'Failed to sign out');
            } finally {
              setIsSigningOut(false);
            }
          })();
        },
      },
    ]);
  };

  return (
    <View className='w-full rounded-xl border-2 border-primary/20 bg-card p-2'>
      <Pressable
        className='flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3 active:opacity-80'
        disabled={isSigningOut}
        onPress={handleSignOut}>
        <LogOut size={18} color={colors.primaryForeground} />
        <Text className='text-base font-semibold text-primary-foreground'>
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Text>
      </Pressable>
    </View>
  );
}
