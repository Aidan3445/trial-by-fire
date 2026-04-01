import { View, Text, Switch, Pressable, AppState } from 'react-native';
import { Bell, BellOff } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import { useNotificationSettings } from '~/hooks/user/useNotificationSettings';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { useEffect, useState } from 'react';
import { registerPushToken } from '~/lib/notifications';
import { useFetch } from '~/hooks/helpers/useFetch';
import { Linking } from 'react-native';

export default function NotificationSettings() {
  const postData = useFetch('POST');
  const { settings, isLoading, updateSetting, toggleEnabled } = useNotificationSettings();
  const [permissionStatus, setPermissionStatus] =
    useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    Notifications.getPermissionsAsync().then(({ status }) =>
      setPermissionStatus(status),
    );

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        Notifications.getPermissionsAsync().then(({ status }) =>
          setPermissionStatus(status),
        );
      }
    });

    return () => sub.remove();
  }, []);


  const requestPermissions = async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    setPermissionStatus(status);
    if (status === 'granted') {
      await registerPushToken(postData);
    } else {
      void Linking.openSettings();
    }
  };
  if (isLoading) {
    return (
      <View className='w-full rounded-xl border-2 border-primary/20 bg-card p-2'>
        <Text className='text-base text-muted-foreground'>Loading...</Text>
      </View>
    );
  }

  const needsPermission = permissionStatus !== 'granted';

  return (
    <View className='w-full gap-2 rounded-xl border-2 border-primary/20 bg-card p-2'>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Notifications
          </Text>
        </View>
        <Pressable onPress={toggleEnabled}>
          {settings.enabled ? (
            <Bell size={24} color={colors.primary} />
          ) : (
            <BellOff size={24} color={colors.mutedForeground} />
          )}
        </Pressable>
      </View>

      {/* Permission Warning */}
      {needsPermission && (
        <Pressable
          className='rounded-lg border-2 border-destructive/20 bg-destructive/10 px-3 py-2 active:opacity-80'
          onPress={() => void requestPermissions()}>
          <Text className='text-sm font-medium text-destructive'>
            Notifications are disabled. Tap to enable.
          </Text>
        </Pressable>
      )}

      {/* Master Toggle Info */}
      {!settings.enabled && (
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
          <Text className='text-sm text-muted-foreground'>
            All notifications are paused. Your preferences below are saved.
          </Text>
        </View>
      )}

      {/* Settings */}
      <View className={cn('gap-2', !settings.enabled && 'opacity-50')}>
        {/* Reminders */}
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
          <View className='flex-row items-center justify-between'>
            <Text className='font-bold text-foreground'>Reminders</Text>
            <Switch
              value={settings.reminders}
              onValueChange={(value) => updateSetting('reminders', value)}
              disabled={!settings.enabled}
              trackColor={{ false: colors.destructive, true: colors.positive }}
              thumbColor='white' />
          </View>
          <Text className='text-sm text-muted-foreground'>
            Predictions and secondary pick reminders before episodes air.
          </Text>
        </View>

        {/* League Activity */}
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
          <View className='flex-row items-center justify-between'>
            <Text className='font-bold text-foreground'>League Activity</Text>
            <Switch
              value={settings.leagueActivity}
              onValueChange={(value) => updateSetting('leagueActivity', value)}
              disabled={!settings.enabled}
              trackColor={{ false: colors.destructive, true: colors.positive }}
              thumbColor='white' />
          </View>
          <Text className='text-sm text-muted-foreground'>
            League admission and draft start notifications.
          </Text>
        </View>

        {/* Episode Updates */}
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-1'>
          <View className='flex-row items-center justify-between'>
            <Text className='font-bold text-foreground'>Episode Updates</Text>
            <Switch
              value={settings.episodeUpdates}
              onValueChange={(value) => updateSetting('episodeUpdates', value)}
              disabled={!settings.enabled}
              trackColor={{ false: colors.destructive, true: colors.positive }}
              thumbColor='white' />
          </View>
          <Text className='text-sm text-muted-foreground'>
            Get notified when episodes finish airing.
          </Text>
        </View>
      </View>
    </View>
  );
}
