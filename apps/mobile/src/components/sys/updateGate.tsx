import { useCallback, useEffect, useState } from 'react';
import { AppState, Linking, Modal as NativeModal, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import { APP_PLATFORM, APP_VERSION, onUpgradeRequired } from '~/lib/appVersion';
import { isOlderThan } from '~/lib/utils';
import { type AppVersionInfo } from '~/types/app';

const NUDGE_DISMISSED_KEY_PREFIX = 'update_nudge_dismissed_';

async function fetchVersionInfo() {
  const res = await fetch(`${process.env.EXPO_PUBLIC_API_URL}/api/app/version`);
  if (!res.ok) throw new Error(`Version check failed: ${res.status}`);
  return res.json() as Promise<AppVersionInfo>;
}

/**
  * Blocks the app with an update screen when it's older than the API's minimum
  * version, and nudges once per release when a newer one is out. Checks on
  * launch, on return to the app, and whenever the API turns a request away.
  * A failed check never blocks.
  */
export default function UpdateGate() {
  const [info, setInfo] = useState<AppVersionInfo | null>(null);
  const [nudge, setNudge] = useState(false);

  const storeUrl = APP_PLATFORM ? info?.storeUrl[APP_PLATFORM] : undefined;
  // Never block without somewhere to update from
  const required = !!storeUrl && isOlderThan(APP_VERSION, info?.minVersion);

  const check = useCallback(async () => {
    try {
      const latest = await fetchVersionInfo();
      setInfo(latest);
      if (!latest.latestVersion || !isOlderThan(APP_VERSION, latest.latestVersion)) return;
      const dismissed = await AsyncStorage.getItem(`${NUDGE_DISMISSED_KEY_PREFIX}${latest.latestVersion}`);
      setNudge(!dismissed);
    } catch (e) {
      console.warn('Could not check for app updates', e);
    }
  }, []);

  useEffect(() => {
    void check();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void check();
    });
    const unsubscribe = onUpgradeRequired(setInfo);
    return () => {
      subscription.remove();
      unsubscribe();
    };
  }, [check]);

  const openStore = () => {
    if (storeUrl) void Linking.openURL(storeUrl);
  };

  const dismissNudge = () => {
    setNudge(false);
    if (info?.latestVersion) void AsyncStorage.setItem(`${NUDGE_DISMISSED_KEY_PREFIX}${info.latestVersion}`, 'true');
  };

  if (required) {
    return (
      <NativeModal visible animationType='fade' onRequestClose={() => undefined}>
        <View className='flex-1 items-center justify-center gap-4 bg-background px-8'>
          <Text className='text-center text-2xl font-black uppercase text-foreground'>Update Required</Text>
          <Text className='text-center text-base text-muted-foreground'>
            This version of Trial by Fire is no longer supported. Update to keep playing.
          </Text>
          <Button onPress={openStore} className='w-full rounded-lg bg-primary px-4 py-3'>
            <Text className='text-center text-base font-semibold text-primary-foreground'>Update now</Text>
          </Button>
        </View>
      </NativeModal>
    );
  }

  return (
    <Modal visible={nudge && !!storeUrl} onClose={dismissNudge}>
      <View className='gap-3'>
        <View className='gap-1'>
          <Text className='text-lg font-bold text-foreground'>Update available</Text>
          <Text className='text-sm text-muted-foreground'>
            A new version of Trial by Fire is out with fixes and improvements.
          </Text>
        </View>
        <Button onPress={() => { openStore(); dismissNudge(); }} className='w-full rounded-lg bg-primary px-4 py-3'>
          <Text className='text-center text-base font-semibold text-primary-foreground'>Update</Text>
        </Button>
        <Button onPress={dismissNudge} className='self-center pt-1'>
          <Text className='text-center text-xs text-muted-foreground'>Not now</Text>
        </Button>
      </View>
    </Modal>
  );
}
