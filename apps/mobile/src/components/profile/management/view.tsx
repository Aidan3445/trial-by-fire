import { View, Text, Pressable } from 'react-native';
import { Settings } from 'lucide-react-native';

import { useUserManagement } from '~/hooks/user/useUserManagement';
import { cn } from '~/lib/utils';
import EmailField from '~/components/profile/management/email';
import UsernameField from '~/components/profile/management/username';
import PasswordField from '~/components/profile/management/password';
import { Link, useRouter } from 'expo-router';
import { colors } from '~/lib/colors';

interface AccountSettingsProps {
  locked: boolean;
}

export default function AccountSettings({ locked }: AccountSettingsProps) {
  const router = useRouter();
  const { reactForm, isDirty, handleSubmit } = useUserManagement();


  return (
    <View className='w-full gap-2 rounded-xl border-2 border-primary/20 bg-card p-2'>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Account
          </Text>
        </View>
        {locked &&
          <Link href='/profile/account'>
            <Settings size={24} color={colors.primary} />
          </Link>
        }
      </View>

      <EmailField locked={locked} />
      <UsernameField control={reactForm.control} locked={locked} />
      <PasswordField control={reactForm.control} locked={locked} />

      {/* Action Buttons */}
      {!locked && (
        <View className='flex-row gap-2'>
          <Pressable
            className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
            onPress={() => router.back()}>
            <Text className='text-center font-semibold text-destructive-foreground'>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              !isDirty && 'opacity-50'
            )}
            disabled={!isDirty}
            onPress={() => { void handleSubmit(); router.back(); }}>
            <Text className='text-center font-semibold text-primary-foreground'>
              Save
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}
