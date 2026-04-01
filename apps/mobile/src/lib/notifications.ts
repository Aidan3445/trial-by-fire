import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_STORAGE_KEY = 'expo_push_token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return null;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#E5BC8F',
      });
    }

    return token;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

export async function registerPushToken(
  postFn: (_url: string, _opts: { body: unknown }) => Promise<unknown>,
) {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') return null;

  const token = await getExpoPushToken();
  if (!token) return null;

  const cached = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (cached === token) return token;

  const settingsStr = await AsyncStorage.getItem('notification_settings');
  const settings = settingsStr ? JSON.parse(settingsStr) : null;

  await postFn('/api/notifications', {
    body: {
      token,
      platform: Platform.OS as 'ios' | 'android',
      preferences: settings
        ? {
          reminders: settings.reminders,
          leagueActivity: settings.leagueActivity,
          episodeUpdates: settings.episodeUpdates,
        }
        : undefined,
    },
  });

  await AsyncStorage.setItem(TOKEN_STORAGE_KEY, token);
  return token;
}

export async function unregisterPushToken(
  deleteFn: (_url: string, _opts: { body: unknown }) => Promise<unknown>,
) {
  const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) return;

  await deleteFn('/api/notifications', { body: { token } });
  await AsyncStorage.removeItem(TOKEN_STORAGE_KEY);
}
