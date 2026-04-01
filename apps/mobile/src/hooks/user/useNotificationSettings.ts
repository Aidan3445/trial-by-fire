import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFetch } from '~/hooks/helpers/useFetch';

const STORAGE_KEY = 'notification_settings';
const TOKEN_STORAGE_KEY = 'expo_push_token';

export interface NotificationSettings {
  enabled: boolean;
  reminders: boolean;
  leagueActivity: boolean;
  episodeUpdates: boolean;
}

const defaultSettings: NotificationSettings = {
  enabled: true,
  reminders: true,
  leagueActivity: true,
  episodeUpdates: true,
};

export function useNotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const putData = useFetch('PUT');

  // Load settings from AsyncStorage on mount
  useEffect(() => {
    void (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setSettings({ ...defaultSettings, ...JSON.parse(stored) });
        }
      } catch (error) {
        console.error('Failed to load notification settings:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Sync settings to server
  const syncToServer = useCallback(
    async (newSettings: NotificationSettings) => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_STORAGE_KEY);
        if (!token) return; // No token registered yet

        await putData('/api/notifications', {
          body: {
            token,
            enabled: newSettings.enabled,
            preferences: {
              reminders: newSettings.reminders,
              leagueActivity: newSettings.leagueActivity,
              episodeUpdates: newSettings.episodeUpdates,
            },
          },
        });
      } catch (error) {
        console.error('Failed to sync settings to server:', error);
      }
    },
    [putData]
  );

  // Save settings to AsyncStorage and sync to server
  const saveSettings = useCallback(
    async (newSettings: NotificationSettings) => {
      try {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
        setSettings(newSettings);
        await syncToServer(newSettings);
      } catch (error) {
        console.error('Failed to save notification settings:', error);
      }
    },
    [syncToServer]
  );

  // Update a single setting
  const updateSetting = useCallback(
    <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
      const newSettings = { ...settings, [key]: value };
      void saveSettings(newSettings);
    },
    [settings, saveSettings]
  );

  // Toggle master switch - preserves other settings
  const toggleEnabled = useCallback(() => {
    updateSetting('enabled', !settings.enabled);
  }, [settings.enabled, updateSetting]);

  return {
    settings,
    isLoading,
    updateSetting,
    toggleEnabled,
  };
}
