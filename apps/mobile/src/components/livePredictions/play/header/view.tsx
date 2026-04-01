'use client';

import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, Zap, Trophy, BarChart3, Bell, BellOff, Check } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { Platform, Text, View } from 'react-native';
import * as Notifications from 'expo-notifications';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { useNotificationSettings } from '~/hooks/user/useNotificationSettings';
import { useLiveScoringSession } from '~/hooks/user/useLiveScoringSession';

interface LivePredictionsHeaderProps {
  episodeId?: number;
}

export default function LivePredictionsHeader({ episodeId }: LivePredictionsHeaderProps) {
  const router = useRouter();
  const height = useHeaderHeight(Platform.OS === 'ios' ? 0 : undefined);
  const [showHelp, setShowHelp] = useState(false);
  const { settings } = useNotificationSettings();
  const { isOptedIn, optIn, isOptingIn } = useLiveScoringSession(episodeId);
  const [pushPermission, setPushPermission] = useState<Notifications.PermissionStatus | null>(null);

  useEffect(() => {
    void Notifications.getPermissionsAsync().then(({ status }) => setPushPermission(status));
  }, []);

  const notificationsDisabled = pushPermission !== 'granted' || !settings.enabled;

  return (
    <>
      <View
        className={cn(
          'absolute top-0 z-10 w-full items-center bg-card shadow-lg',
          Platform.OS === 'ios' ? 'justify-center' : 'justify-end'
        )}
        style={{ height }}>
        <View className='items-center justify-center w-full'>
          <View className='relative flex-row items-center justify-center gap-0.5 w-full'>
            <Button
              onPress={() => router.back()}
              className='absolute left-4 p-1 px-4'>
              <ArrowLeft size={24} color={colors.primary} />
            </Button>
            <View className='h-6 w-1 bg-primary rounded-full' />
            <Text
              allowFontScaling={false}
              className='text-2xl font-black uppercase tracking-tight text-foreground'>
              {'Predictions & Polls'}
            </Text>
            <View className='h-6 w-1 bg-primary rounded-full' />
            <Button
              onPress={() => setShowHelp(true)}
              className='absolute right-4 p-1 px-4'>
              <HelpCircle size={24} color={colors.primary} />
            </Button>
          </View>
        </View>
      </View>

      <Modal visible={showHelp} onClose={() => setShowHelp(false)}>
        <View className='gap-4'>
          {/* Header */}
          <View className='flex-row items-center gap-3'>
            <View className='h-6 w-1 rounded-full bg-primary' />
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              How It Works
            </Text>
          </View>

          {/* Intro */}
          <Text className='text-base text-muted-foreground'>
            Live predictions and polls are a fun, no-stakes way to test your Survivor instincts while watching episodes in real time.
          </Text>

          {/* Info items */}
          <View className='gap-3'>
            <InfoRow
              icon={Zap}
              title='Real-Time Predictions'
              description='Predictions drop during live episodes. Pick your answer before time runs out.' />
            <InfoRow
              icon={Trophy}
              title='Bragging Rights Only'
              description='Live predictions do not affect your fantasy score. No points gained or lost, just glory.' />
            <InfoRow
              icon={BarChart3}
              title='Track Your Accuracy'
              description='See your correct prediction percentage and build a streak across the season.' />

            {/* Notification state */}
            {isOptedIn ? (
              <View className='flex-row items-start gap-3 rounded-lg border-2 border-emerald-500/20 bg-emerald-500/10 px-3 py-2'>
                <Check size={18} color={colors.positive} className='mt-0.5' />
                <View className='flex-1 gap-0.5'>
                  <Text className='text-base font-bold text-emerald-500'>You're Live</Text>
                  <Text className='text-sm text-muted-foreground leading-snug'>
                    You'll get notified when predictions and polls drop this episode.
                  </Text>
                </View>
              </View>
            ) : notificationsDisabled ? (
              <View className='rounded-lg border-2 border-destructive/20 bg-destructive/10 px-3 py-2 gap-2'>
                <View className='flex-row items-start gap-3'>
                  <BellOff size={18} color={colors.destructive} className='mt-0.5' />
                  <View className='flex-1 gap-0.5'>
                    <Text className='text-base font-bold text-destructive'>Notifications Off</Text>
                    <Text className='text-sm text-muted-foreground leading-snug'>
                      Enable notifications in your profile to get live alerts.
                    </Text>
                  </View>
                </View>
                <Button
                  onPress={() => { setShowHelp(false); router.dismissTo('/profile'); }}
                  className='rounded-lg border-2 border-destructive/20 bg-card p-2.5 active:opacity-80'>
                  <Text className='text-center text-sm font-semibold text-destructive'>
                    Go to Profile
                  </Text>
                </Button>
              </View>
            ) : (
              <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2 gap-2'>
                <View className='flex-row items-start gap-3'>
                  <Bell size={18} color={colors.primary} className='mt-0.5' />
                  <View className='flex-1 gap-0.5'>
                    <Text className='text-base font-bold text-foreground'>Get Notified</Text>
                    <Text className='text-sm text-muted-foreground leading-snug'>
                      Opt in to get push notifications when predictions and polls drop this episode.
                    </Text>
                  </View>
                </View>
                {!!episodeId && (
                  <Button
                    onPress={optIn}
                    disabled={isOptingIn}
                    className={cn(
                      'rounded-lg bg-secondary p-2.5 w-min',
                      isOptingIn && 'opacity-50'
                    )}>
                    <Text className='text-center text-sm font-semibold text-primary-foreground'>
                      {isOptingIn ? 'Opting in...' : 'Opt In'}
                    </Text>
                  </Button>
                )}
              </View>
            )}
          </View>

          {/* Dismiss */}
          <Button
            className='rounded-lg bg-primary p-3 active:opacity-80'
            onPress={() => setShowHelp(false)}>
            <Text className='text-center font-semibold text-primary-foreground'>Got It</Text>
          </Button>
        </View>
      </Modal>
    </>
  );
}

function InfoRow({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Zap;
  title: string;
  description: string;
}) {
  return (
    <View className='flex-row items-start gap-3 rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
      <Icon size={18} color={colors.primary} className='mt-0.5' />
      <View className='flex-1 gap-0.5'>
        <Text className='text-base font-bold text-foreground'>{title}</Text>
        <Text className='text-sm text-muted-foreground leading-snug'>{description}</Text>
      </View>
    </View>
  );
}
