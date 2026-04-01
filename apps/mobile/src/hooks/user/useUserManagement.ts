import { useEffect } from 'react';
import { Alert } from 'react-native';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useUser } from '@clerk/expo';
import { z } from 'zod';

const UserSettingsSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(20, 'Username must be 20 characters or less')
      .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores'),
    currentPassword: z.string(),
    newPassword: z.string(),
    confirmPassword: z.string(),
  })
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) return false;
      return true;
    },
    { message: 'Current password required', path: ['currentPassword'] }
  )
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword.length < 8) return false;
      return true;
    },
    { message: 'Password must be at least 8 characters', path: ['newPassword'] }
  )
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type UserSettings = z.infer<typeof UserSettingsSchema>;

export function useUserManagement() {
  const { user } = useUser();

  const reactForm = useForm<UserSettings>({
    defaultValues: {
      username: user?.username ?? '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
    resolver: zodResolver(UserSettingsSchema),
  });

  useEffect(() => {
    if (user?.username) {
      reactForm.reset({
        username: user.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [user?.username, reactForm]);

  const isDirty = reactForm.formState.isDirty;

  const handleSubmit = reactForm.handleSubmit(async (data) => {
    if (!user) return;

    try {
      const usernameChanged = data.username !== user.username;
      const passwordChanged = data.newPassword.length > 0;

      if (usernameChanged) {
        await user.update({ username: data.username });
      }

      if (passwordChanged) {
        await user.updatePassword({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        });
      }

      reactForm.reset({
        username: data.username,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      Alert.alert('Success', 'Profile updated!');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      const message = error?.errors?.[0]?.message ?? 'Failed to update profile';
      Alert.alert('Error', message);
    }
  });

  return {
    reactForm,
    isDirty,
    handleSubmit,
    user,
  };
}
