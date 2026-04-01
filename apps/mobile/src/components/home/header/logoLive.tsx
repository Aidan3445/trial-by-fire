import { useEffect, useMemo, useState } from 'react';
import { View, Image, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Zap, Flame, Radio } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { useLivePredictions } from '~/hooks/livePredictions/query/useLivePredictions';
import { useLivePredictionStats } from '~/hooks/livePredictions/query/useLivePredictionStats';
import { useLiveScoringSession } from '~/hooks/user/useLiveScoringSession';
import { PointsIcon } from '~/components/icons/generated';
import Button from '~/components/common/button';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LogoImage = require('~/assets/LogoFull.png');

interface LogoLiveProps {
  className?: string;
}

const OPENED_KEY = 'live_opened_ep';

export default function LogoLive({ className }: LogoLiveProps) {
  const router = useRouter();
  const { airingEpisode, data: predictions, seasonId } = useLivePredictions();
  const { data: stats } = useLivePredictionStats(seasonId);
  const { isOptedIn } = useLiveScoringSession(airingEpisode?.episodeId);
  const [opened, setOpened] = useState(false);

  const isLive = !!airingEpisode;

  const openKey = `${OPENED_KEY}_${airingEpisode?.episodeId}`;
  useEffect(() => {
    void (async () => {
      const wasOpened = await AsyncStorage.getItem(openKey);
      setOpened(wasOpened === 'true');
    })();
  }, [openKey, airingEpisode]);
  const markOpened = () => {
    setOpened(true);
    void AsyncStorage.setItem(openKey, 'true');
    router.push('/(protected)/(modals)/live');
  };

  const openPredictions = useMemo(
    () => predictions?.filter((p) => p.status === 'Open' && !p.paused) ?? [],
    [predictions]
  );
  const unanswered = useMemo(
    () => openPredictions.filter((p) => !p.userResponse).length,
    [openPredictions]
  );

  type LiveCardMode = 'cta' | 'pending' | 'active' | 'stats';

  const mode: LiveCardMode = useMemo(() => {
    if (!isOptedIn && isLive && !opened) return 'cta';
    if (openPredictions.length > 0) return 'active';
    return 'stats';
  }, [opened, isLive, isOptedIn, openPredictions.length]);

  const cardClass = cn(
    'h-32 w-32 items-center justify-between gap-1.5 rounded-xl border-2 bg-card px-4 py-3',
    mode === 'cta' && 'border-primary/20',
    mode === 'active' && 'border-amber-500/20',
    mode === 'stats' && 'border-positive/20'
  );

  const liveLabelColor =
    mode === 'stats' ? 'text-positive' : 'text-amber-500';

  return (
    <View className={cn('flex-row items-center justify-evenly', className)}>
      <View className={cn('transition-transform', !isLive && 'items-center')}>
        <Image source={LogoImage} className='h-32 w-72' resizeMode='stretch' />
      </View>

      {isLive && (
        <View>
          <Button
            onPress={markOpened}
            className='active:opacity-80' >
            <View className={cardClass}>
              {/* Header */}
              {mode === 'cta' ? (
                <>
                  <Radio size={20} color={colors.primary} />
                  <Text className={cn('text-sm font-bold text-primary')}>
                    Go Live
                  </Text>
                </>
              ) : (
                <View className='flex-row items-center gap-1'>
                  {mode === 'stats' ? (
                    <Flame size={16} color={colors.positive} />
                  ) : (
                    <Zap size={16} color={'#f59e0b'} />
                  )}
                  <Text className={cn('text-sm font-bold', liveLabelColor)}>
                    LIVE
                  </Text>
                </View>
              )}

              {/* Body */}
              {mode === 'cta' && (
                <Text
                  allowFontScaling={false}
                  className='text-sm text-muted-foreground text-center'>
                  Tap to join live scoring
                </Text>
              )}

              {mode === 'active' && (
                unanswered > 0 ? (
                  <View className='items-center'>
                    <Text className='text-lg font-black text-amber-500'>
                      {unanswered}
                    </Text>
                    <Text className='text-sm text-muted-foreground'>
                      {unanswered === 1 ? 'prediction' : 'predictions'}
                    </Text>
                  </View>
                ) : (
                  <Text
                    allowFontScaling={false}
                    className='text-sm text-muted-foreground text-center'
                  >
                    All answered!
                  </Text>
                )
              )}

              {mode === 'stats' && (
                stats && stats.totalAnswered > 0 ? (
                  <View className='items-center'>
                    <Text className='text-lg font-black text-positive'>
                      {Math.round(stats.accuracy * 100)}%
                    </Text>
                    <Text className='text-sm text-muted-foreground'>
                      accuracy
                    </Text>

                    {stats.currentStreak > 1 && (
                      <View className='flex-row items-center justify-center'>
                        <View style={{ marginTop: -2 }}>
                          <PointsIcon size={12} color='#ff8040' />
                        </View>
                        <Text className='text-sm font-bold text-amber-500'>
                          {stats.currentStreak} in a row!
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text
                    allowFontScaling={false}
                    className='text-sm text-muted-foreground text-center'
                  >
                    Waiting for predictions...
                  </Text>
                )
              )}
            </View>
          </Button>
        </View>
      )}
    </View>
  );
}
