import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { APP_PLATFORM_HEADER, APP_VERSION_HEADER, type AppPlatform, type AppVersionInfo } from '~/types/app';

// From app.json at build time
export const APP_VERSION = Constants.expoConfig?.version ?? null;
export const APP_PLATFORM: AppPlatform | null = Platform.OS === 'ios' || Platform.OS === 'android' ? Platform.OS : null;

/** Sent with every API request so the server can tell old apps apart */
export const appVersionHeaders = (): Record<string, string> => ({
  ...(APP_VERSION ? { [APP_VERSION_HEADER]: APP_VERSION } : {}),
  ...(APP_PLATFORM ? { [APP_PLATFORM_HEADER]: APP_PLATFORM } : {}),
});

// The API said this app is too old; the update gate listens for it
type Listener = (_info: AppVersionInfo) => void;
const listeners = new Set<Listener>();

export function onUpgradeRequired(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportUpgradeRequired(info: AppVersionInfo) {
  listeners.forEach((listener) => listener(info));
}
