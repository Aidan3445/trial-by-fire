import { View, Text, Pressable } from 'react-native';
import { Bell } from 'lucide-react-native';

import { useNotifications } from '~/hooks/user/useNotifications';
import { colors } from '~/lib/colors';

export default function NotificationTest() {
  const { scheduleLocalNotification, permissionStatus } = useNotifications();

  const sendTest = (delaySeconds: number) => {
    void scheduleLocalNotification(
      'Test Notification',
      delaySeconds === 0
        ? 'This is an instant notification!'
        : `This notification was delayed ${delaySeconds} seconds.`,
      delaySeconds
    );
  };

  return (
    <View className='w-full gap-2 rounded-xl border-2 border-primary/20 bg-card p-2'>
      {/* Header */}
      <View className='flex-row items-center gap-2 px-1'>
        <Bell size={18} color={colors.primary} />
        <Text className='text-base font-semibold text-foreground'>
          Notification Test
        </Text>
        {permissionStatus && (
          <Text className='text-sm text-muted-foreground'>
            ({permissionStatus})
          </Text>
        )}
      </View>

      {/* Buttons */}
      <View className='flex-row gap-2'>
        <Pressable
          className='flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:opacity-80'
          onPress={() => sendTest(0)}>
          <Text className='text-center font-semibold text-foreground'>Now</Text>
        </Pressable>
        <Pressable
          className='flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:opacity-80'
          onPress={() => sendTest(5)}>
          <Text className='text-center font-semibold text-foreground'>5s</Text>
        </Pressable>
        <Pressable
          className='flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:opacity-80'
          onPress={() => sendTest(20)}>
          <Text className='text-center font-semibold text-foreground'>20s</Text>
        </Pressable>
      </View>
    </View>
  );
}
