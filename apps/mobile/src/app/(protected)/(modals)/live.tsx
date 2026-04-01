import { useEffect, useMemo, useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, BellOff, Radio, ChevronRight, ChevronDown, ChevronUp, Zap, Lock, Check } from 'lucide-react-native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { useLivePredictions } from '~/hooks/livePredictions/query/useLivePredictions';
import { useRespondLivePrediction } from '~/hooks/livePredictions/mutation/useRespondLivePrediction';
import { useLiveScoringSession } from '~/hooks/user/useLiveScoringSession';
import { useNotificationSettings } from '~/hooks/user/useNotificationSettings';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import LivePredictionsHeader from '~/components/livePredictions/play/header/view';
import PredictionCard from '~/components/livePredictions/play/card/view';
import LiveLeaderboard from '~/components/livePredictions/play/leaderboard/view';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import { type LivePredictionWithOptions } from '~/types/events';

const DISMISSED_KEY = 'live_opt_in_dismissed_ep';

type SectionKey = 'active' | 'waiting' | 'results';

interface SectionConfig {
  key: SectionKey;
  title: string;
  icon: typeof Zap;
  iconColor: string;
  borderClass: string;
}

const SECTIONS: SectionConfig[] = [
  { key: 'active', title: 'Active', icon: Zap, iconColor: '#f59e0b', borderClass: 'border-amber-500/30' },
  { key: 'waiting', title: 'Waiting for Results', icon: Lock, iconColor: '#3b82f6', borderClass: 'border-blue-500/30' },
  { key: 'results', title: 'Results', icon: Check, iconColor: colors.primary!, borderClass: 'border-primary/30' },
];

export default function LivePredictionsScreen() {
  const router = useRouter();
  const { airingEpisode, data: predictions, seasonId } = useLivePredictions();
  const { isOptedIn, optIn, isOptingIn } = useLiveScoringSession(airingEpisode?.episodeId);
  const { respond, isSubmitting } = useRespondLivePrediction(airingEpisode?.episodeId);
  const { settings } = useNotificationSettings();
  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh([
    ['livePredictions'],
    ['liveLeaderboard', seasonId ?? undefined],
    ['livePredictionStats', seasonId ?? undefined],
  ]);

  const [pushPermission, setPushPermission] = useState<Notifications.PermissionStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const episodeId = airingEpisode?.episodeId;
  const dismissKey = `${DISMISSED_KEY}_${episodeId}`;

  useEffect(() => {
    void (async () => {
      const status = await Notifications.getPermissionsAsync();
      setPushPermission(status.status);

      if (episodeId) {
        const wasDismissed = await AsyncStorage.getItem(dismissKey);
        setDismissed(wasDismissed === 'true');
      }
      setLoaded(true);
    })();
  }, [episodeId, dismissKey]);

  const handleDismiss = () => {
    setDismissed(true);
    if (episodeId) {
      void AsyncStorage.setItem(dismissKey, 'true');
    }
  };

  const handleOptIn = () => {
    optIn();
    handleDismiss();
  };

  const sectionData = useMemo(() => {
    const active = predictions?.filter((p) => p.status === 'Open' && !p.paused) ?? [];
    const waiting = predictions?.filter((p) => p.status === 'Closed' && !p.paused) ?? [];
    const results = predictions?.filter((p) => p.status === 'Resolved') ?? [];
    return { active, waiting, results } as Record<SectionKey, LivePredictionWithOptions[]>;
  }, [predictions]);

  // Auto-expand: if only one section has items, open it. Otherwise open 'active' if it has items.
  const defaultExpanded = useMemo(() => {
    const nonEmpty = SECTIONS.filter((s) => sectionData[s.key].length > 0);
    if (nonEmpty.length === 1) return new Set([nonEmpty[0]!.key]);
    if (sectionData.active.length > 0) return new Set<SectionKey>(['active']);
    if (nonEmpty.length > 0) return new Set([nonEmpty[0]!.key]);
    return new Set<SectionKey>();
  }, [sectionData]);

  const [expanded, setExpanded] = useState<Set<SectionKey>>(defaultExpanded);

  // Sync default when predictions change
  useEffect(() => {
    setExpanded(defaultExpanded);
  }, [defaultExpanded]);

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  if (!loaded) return null;

  const notificationsDisabled = pushPermission !== 'granted' || !settings.enabled;
  const showBanner = !isOptedIn && !dismissed && !!episodeId;
  const hasPredictions = predictions && predictions.length > 0;

  return (
    <SafeAreaRefreshView
      className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
      header={<LivePredictionsHeader episodeId={episodeId} />}
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View className={cn(
        'page justify-start gap-4 px-4 pb-12',
        Platform.OS === 'ios' && 'pt-12'
      )}>

        {/* No episode airing */}
        {!airingEpisode && (
          <>
            <View className='items-center gap-4 py-8 w-full'>
              <Radio size={48} color={colors.mutedForeground} />
              <Text className='text-lg font-bold text-muted-foreground text-center'>
                No episode is currently airing
              </Text>
              <Text className='text-base text-muted-foreground text-center'>
                Live predictions will appear here when an episode is live.
              </Text>
            </View>
            {seasonId && <LiveLeaderboard seasonId={seasonId} />}
          </>
        )}

        {/* Episode airing */}
        {!!airingEpisode && (
          <>
            {/* Notification banners */}
            {showBanner && notificationsDisabled && (
              <Button
                onPress={() => router.dismissTo('/profile')}
                className='w-full rounded-xl border-2 border-destructive/20 bg-card p-4 flex-row items-center gap-3 active:opacity-80'>
                <BellOff size={20} color={colors.destructive} />
                <View className='flex-1 gap-0.5'>
                  <Text className='text-base font-bold text-destructive'>
                    Notifications are off
                  </Text>
                  <Text className='text-sm text-muted-foreground'>
                    You can still play along, but enable notifications in your profile to get live alerts.
                  </Text>
                </View>
                <ChevronRight size={16} color={colors.destructive} />
              </Button>
            )}

            {showBanner && !notificationsDisabled && (
              <View className='w-full rounded-xl border-2 border-primary/20 bg-card p-4 gap-3'>
                <View className='flex-row items-center gap-2'>
                  <Zap size={20} color={colors.primary} />
                  <Text className='text-base font-bold text-foreground'>
                    Watching live tonight?
                  </Text>
                </View>
                <Text className='text-sm text-muted-foreground'>
                  Opt in to get push notifications for live predictions during this episode.
                </Text>
                <View className='flex-row gap-2'>
                  <Button
                    onPress={handleDismiss}
                    className='flex-1 rounded-lg border-2 border-primary/20 bg-card p-3 active:opacity-80'>
                    <Text className='text-center font-semibold text-foreground'>Not Tonight</Text>
                  </Button>
                  <Button
                    onPress={handleOptIn}
                    disabled={isOptingIn}
                    className={cn(
                      'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
                      isOptingIn && 'opacity-50'
                    )}>
                    <Text className='text-center font-semibold text-primary-foreground'>
                      {isOptingIn ? 'Opting in...' : 'Go Live'}
                    </Text>
                  </Button>
                </View>
              </View>
            )}

            {/* Opted in badge */}
            {isOptedIn && (
              <View className='w-full rounded-xl border-2 border-positive/20 bg-card p-3 flex-row items-center gap-2'>
                <Bell size={16} color={colors.positive} />
                <Text className='text-sm font-semibold text-positive'>
                  You're live — predictions will appear as they drop
                </Text>
              </View>
            )}

            {/* Leaderboard */}
            <LiveLeaderboard seasonId={seasonId} />

            {/* Prediction sections */}
            {hasPredictions && (
              <View className='w-full rounded-xl border-2 border-primary/20 bg-card p-3 gap-2'>
                <View className='flex-row items-center gap-2 px-1'>
                  <View className='h-6 w-1 rounded-full bg-primary' />
                  <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
                    Predictions and Polls
                  </Text>
                </View>

                {SECTIONS.map((section) => {
                  const items = sectionData[section.key];
                  if (items.length === 0) return null;
                  const isOpen = expanded.has(section.key);
                  const Icon = section.icon;

                  return (
                    <View
                      key={section.key}
                      className={cn(
                        'rounded-xl border-2 bg-accent overflow-hidden',
                        section.borderClass
                      )}>
                      <Button
                        onPress={() => toggleSection(section.key)}
                        className='flex-row items-center justify-between p-3 active:opacity-80'>
                        <View className='flex-row items-center gap-2 flex-1'>
                          <Icon size={16} color={section.iconColor} />
                          <Text className='text-base font-bold text-foreground'>
                            {section.title}
                          </Text>
                          <View className='rounded-full bg-primary/15 px-2 py-0.5'>
                            <Text className='text-sm font-bold text-primary'>
                              {items.length}
                            </Text>
                          </View>
                        </View>
                        {isOpen
                          ? <ChevronUp size={18} color={colors.mutedForeground} />
                          : <ChevronDown size={18} color={colors.mutedForeground} />}
                      </Button>

                      {isOpen && (
                        <View className='px-2 pb-2 gap-2'>
                          {items.map((pred) => (
                            <PredictionCard
                              key={pred.livePredictionId}
                              prediction={pred}
                              onRespond={section.key === 'active'
                                ? (optionId) => respond(pred.livePredictionId, optionId)
                                : () => { }}
                              isSubmitting={section.key === 'active' && isSubmitting} />
                          ))}
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            )}

            {/* Empty state */}
            {predictions && predictions.length === 0 && (
              <View className='items-center py-8 gap-2'>
                <Zap size={32} color={colors.mutedForeground} />
                <Text className='text-base text-muted-foreground text-center'>
                  No predictions or polls yet — stay tuned!
                </Text>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaRefreshView>
  );
}
