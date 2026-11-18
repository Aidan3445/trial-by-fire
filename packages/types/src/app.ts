// Headers the mobile app sends with every API request
export const APP_VERSION_HEADER = 'X-App-Version';
export const APP_PLATFORM_HEADER = 'X-App-Platform';
// Status the API answers with when the app is too old to be served
export const UPGRADE_REQUIRED_STATUS = 426;

export type AppPlatform = 'ios' | 'android';

/** From GET /api/app/version, for prompting app updates */
export type AppVersionInfo = {
  // Older apps are blocked until they update; null means no minimum
  minVersion: string | null;
  // Older apps get a dismissible nudge; null means no nudge
  latestVersion: string | null;
  // Where to update; a platform without one is never blocked
  storeUrl: Partial<Record<AppPlatform, string>>;
};
