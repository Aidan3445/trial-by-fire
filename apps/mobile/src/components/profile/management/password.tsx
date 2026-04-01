import { View, Text, TextInput } from 'react-native';
import { Controller, type Control } from 'react-hook-form';

import { colors } from '~/lib/colors';
import { type UserSettings } from '~/hooks/user/useUserManagement';

interface PasswordFieldProps {
  control: Control<UserSettings>;
  locked: boolean;
}

export default function PasswordField({ control, locked }: PasswordFieldProps) {
  if (locked) {
    return (
      <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
        <Text className='text-sm text-muted-foreground'>Password</Text>
        <Text className='text-base font-medium text-foreground'>••••••••</Text>
      </View>
    );
  }

  return (
    <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-3'>
      <Text className='text-sm text-muted-foreground'>
        Change your password.
      </Text>

      <Controller
        control={control}
        name='currentPassword'
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <View className='gap-1'>
            <Text className='text-sm text-muted-foreground'>Current Password</Text>
            <TextInput
              className='w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-10 text-lg leading-tight overflow-hidden'
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder='Enter current password'
              placeholderTextColor={colors.mutedForeground}
              autoCapitalize='none'
              autoCorrect={false}
              textContentType='none'
              autoComplete='off' />
            {error && (
              <Text className='text-sm text-destructive'>{error.message}</Text>
            )}
          </View>
        )} />

      <Controller
        control={control}
        name='newPassword'
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <View className='gap-1'>
            <Text className='text-sm text-muted-foreground'>New Password</Text>
            <TextInput
              className='w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-10 text-lg leading-tight overflow-hidden'
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder='Enter new password'
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize='none'
              autoCorrect={false}
              textContentType='none'
              autoComplete='off' />
            {error && (
              <Text className='text-sm text-destructive'>{error.message}</Text>
            )}
          </View>
        )} />

      <Controller
        control={control}
        name='confirmPassword'
        render={({ field: { value, onChange, onBlur }, fieldState: { error } }) => (
          <View className='gap-1'>
            <Text className='text-sm text-muted-foreground'>Confirm Password</Text>
            <TextInput
              className='w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-10 text-lg leading-snug overflow-hidden'
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              placeholder='Confirm new password'
              placeholderTextColor={colors.mutedForeground}
              secureTextEntry
              autoCapitalize='none'
              autoCorrect={false}
              textContentType='none'
              autoComplete='off' />
            {error && (
              <Text className='text-sm text-destructive'>{error.message}</Text>
            )}
          </View>
        )} />
    </View>
  );
}
