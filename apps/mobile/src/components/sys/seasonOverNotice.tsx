import { useEffect, useState } from 'react';
import { Linking, Text, View } from 'react-native';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';

let dismissedThisSession = false;

export default function SeasonOverNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (dismissedThisSession) return;
    setShow(true);
  }, []);

  const handleOpenSettings = () => {
    void Linking.openSettings();
    dismissedThisSession = true;
    setShow(false);
  };

  const handleDismiss = () => {
    dismissedThisSession = true;
    setShow(false);
  };

  return (
    <Modal visible={show} onClose={handleDismiss}>
      <View className='gap-3'>
        <View className='gap-1'>
          <Text className='text-lg font-bold text-foreground'>
            Thanks for playing Survivor 50 with us!
          </Text>
          <Text className='text-sm text-muted-foreground'>
            Check back later to create your league for Season 51 this fall.
          </Text>
        </View>
        <Button
          onPress={handleOpenSettings}
          className='w-full rounded-lg bg-primary px-4 py-3'>
          <Text className='text-center text-base font-semibold text-primary-foreground'>
            Turn on notifications to get notified when Season 51 is live
          </Text>
        </Button>
        <Button onPress={handleDismiss} className='w-full pt-1'>
          <Text className='text-center text-xs text-muted-foreground'>
            Dismiss
          </Text>
        </Button>
      </View>
    </Modal>
  );
}
