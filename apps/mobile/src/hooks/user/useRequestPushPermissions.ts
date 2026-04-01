import { useEffect, useRef } from 'react';
import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_PROMPTED_KEY = 'push_permission_prompted';

/**
 * Asks for push notification permission once after first sign-in.
 * - If never asked: shows system permission dialog directly
 * - If previously denied: shows alert with Settings link
 * - If already granted: no-op
 * Call this inside your authenticated layout.
 */
export function useRequestPushPermission() {
  const { isSignedIn, userId } = useAuth();
  const prompted = useRef(false);

  useEffect(() => {
    if (!isSignedIn || !userId || prompted.current) return;
    if (Platform.OS === 'web') return;

    void (async () => {
      const key = `${PUSH_PROMPTED_KEY}_${userId}`;
      const alreadyPrompted = await AsyncStorage.getItem(key);
      if (alreadyPrompted) return;

      prompted.current = true;

      const { status: existing } = await Notifications.getPermissionsAsync();

      if (existing === 'granted') {
        void AsyncStorage.setItem(key, 'true');
        return;
      }

      // Small delay so the app feels settled before prompting
      // eslint-disable-next-line no-undef
      await new Promise((res) => setTimeout(res, 1500));

      if (existing === 'denied') {
        // System dialog was already shown and denied — redirect to Settings
        Alert.alert(
          'Stay in the Game',
          'Open Settings to enable notifications for Trial by Fire.',
          [
            {
              text: 'Not Now',
              style: 'cancel',
              onPress: () => void AsyncStorage.setItem(key, 'true'),
            },
            {
              text: 'Open Settings',
              onPress: () => {
                void Linking.openSettings();
                void AsyncStorage.setItem(key, 'true');
              },
            },
          ]
        );
      } else {
        // First time — show system dialog directly
        const { status } = await Notifications.requestPermissionsAsync();
        void AsyncStorage.setItem(key, 'true');
        if (status === 'denied') {
          // They just denied — offer Settings as a follow-up
          Alert.alert(
            'Stay in the Game',
            'You can enable notifications anytime in Settings.',
            [
              { text: 'OK', style: 'cancel' },
              {
                text: 'Open Settings',
                onPress: () => void Linking.openSettings(),
              },
            ]
          );
        }
      }
    })();
  }, [isSignedIn, userId]);
}
