import 'server-only';

import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { isOlderThan } from '~/lib/utils';
import {
  APP_PLATFORM_HEADER, APP_VERSION_HEADER, type AppPlatform, type AppVersionInfo, UPGRADE_REQUIRED_STATUS,
} from '~/types/app';

const IOS_STORE_URL = 'https://apps.apple.com/app/id6759011635';

/**
  * Which mobile app versions the API still serves. Set in the environment:
  * - MIN_APP_VERSION: raise once an app release that no longer needs the old
  *   API is approved and people have updated; older apps must update
  * - LATEST_APP_VERSION: the newest release, for a dismissible update nudge
  * - ANDROID_STORE_URL: only if the app is on the Play Store
  */
export function getAppVersionInfo(): AppVersionInfo {
  const read = (value?: string) => value?.trim() ? value.trim() : null;
  return {
    minVersion: read(process.env.MIN_APP_VERSION),
    latestVersion: read(process.env.LATEST_APP_VERSION),
    storeUrl: {
      ios: IOS_STORE_URL,
      ...(process.env.ANDROID_STORE_URL ? { android: process.env.ANDROID_STORE_URL } : {}),
    },
  };
}

/**
  * Refuse requests from mobile apps older than the minimum, so they show the
  * update screen instead of breaking on API changes. The web app and apps from
  * before the version header was added send no version and are always served.
  * @returns the 426 response to send, or null to carry on
  */
export async function outdatedAppResponse() {
  const requestHeaders = await headers();
  const version = requestHeaders.get(APP_VERSION_HEADER);
  const platform = requestHeaders.get(APP_PLATFORM_HEADER) as AppPlatform | null;
  const info = getAppVersionInfo();
  // Never block a platform with nowhere to update from
  if (!platform || !info.storeUrl[platform] || !isOlderThan(version, info.minVersion)) return null;
  return NextResponse.json(
    { error: 'This version of the app is no longer supported. Please update.', ...info },
    { status: UPGRADE_REQUIRED_STATUS });
}
