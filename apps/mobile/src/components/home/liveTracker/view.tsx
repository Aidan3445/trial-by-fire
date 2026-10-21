import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import Button from '~/components/common/button';
import { PointsIcon } from '~/components/icons/generated';
import { useEpisodeTracker } from '~/hooks/leagues/enrich/useEpisodeTracker';
import { useLeagues } from '~/hooks/user/useLeagues';
import { getPointsColor } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type League } from '~/types/leagues';

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

function Points({ value, large }: { value: number; large?: boolean }) {
  const color = getPointsColor(value)!;
  return (
    <View className='flex-row items-center gap-0.5'>
      <Text allowFontScaling={false} className={cn('font-bold', large ? 'text-xl' : 'text-sm')} style={{ color }}>
        {signed(value)}
      </Text>
      <PointsIcon size={large ? 14 : 10} color={color} />
    </View>
  );
}

function Chip({ label, children }: { label: string; children: ReactNode }) {
  return (
    <View className='flex-row items-center gap-1.5 rounded-md border border-primary/20 bg-accent/70 px-2 py-0.5'>
      <Text allowFontScaling={false} className='text-sm text-muted-foreground'>{label}</Text>
      {children}
    </View>
  );
}

function LiveLeagueRow({ league, onLive }: { league: League; onLive: (_hash: string, _live: boolean) => void }) {
  const router = useRouter();
  const { tracker, castaways } = useEpisodeTracker(league.hash);
  const live = !!tracker;

  useEffect(() => onLive(league.hash, live), [league.hash, live, onLive]);
  if (!tracker) return null;

  const shortName = (castawayId: number) =>
    castaways?.find((castaway) => castaway.castawayId === castawayId)?.shortName ?? 'Survivor';
  const settled = tracker.predictions.filter((prediction) => prediction.status !== 'pending');
  const hits = settled.filter((prediction) => prediction.status === 'hit').length;
  const pending = tracker.predictions.length - settled.length;
  const predictionPoints = tracker.predictions.reduce((total, prediction) =>
    total + (prediction.status === 'hit' ? prediction.points : 0) + prediction.betResult, 0);

  return (
    <Button
      className='rounded-lg border-2 border-primary/20 bg-primary/5 p-2 gap-1.5 active:bg-primary/10'
      onPress={() => {
        router.replace('/leagues');
        // eslint-disable-next-line no-undef
        setTimeout(() => {
          router.navigate({ pathname: '/leagues/[hash]', params: { hash: league.hash } });
        }, 100);
      }}>
      <View className='flex-row items-center justify-between gap-2'>
        <Text className='flex-1 text-lg font-black leading-tight text-foreground' numberOfLines={1}>
          {league.name}
        </Text>
        <Points value={tracker.total} large />
      </View>
      <View className='flex-row flex-wrap gap-1.5'>
        <Chip label={tracker.pick ? shortName(tracker.pick.castawayId) : 'No pick'}>
          <Points value={tracker.pick?.points ?? 0} />
        </Chip>
        {tracker.secondary && (
          <Chip label={`${shortName(tracker.secondary.castawayId)} ×${tracker.secondary.multiplier}`}>
            <Points value={tracker.secondary.points} />
          </Chip>
        )}
        {tracker.predictions.length > 0 && (
          <Chip label={`Predictions ${hits}/${settled.length}${pending ? ` · ${pending} pending` : ''}`}>
            <Points value={predictionPoints} />
          </Chip>
        )}
      </View>
    </Button>
  );
}

/**
  * While an episode airs, how the user is doing in each of their leagues
  */
export default function LiveTracker() {
  const { data: leagues } = useLeagues();
  const [live, setLive] = useState<Set<string>>(new Set());

  const onLive = useCallback((hash: string, isLive: boolean) => {
    setLive((prev) => {
      if (prev.has(hash) === isLive) return prev;
      const next = new Set(prev);
      if (isLive) next.add(hash);
      else next.delete(hash);
      return next;
    });
  }, []);

  const activeLeagues = leagues?.filter(({ league }) => league.status === 'Active') ?? [];
  if (activeLeagues.length === 0) return null;

  // Rows decide for themselves whether their league is airing; the card shows once one is
  return (
    <View
      className='rounded-xl border-2 border-primary/20 bg-card p-3 gap-2'
      style={live.size === 0 ? { display: 'none' } : undefined}>
      <View className='gap-0.5'>
        <View className='flex-row items-center gap-2'>
          <View className='h-8 w-1 rounded-full bg-primary' />
          <Text className='text-2xl font-black uppercase tracking-tight text-foreground'>Live Now</Text>
        </View>
        <Text className='text-sm text-muted-foreground'>Your points this episode in each league</Text>
      </View>
      {activeLeagues.map(({ league }) => (
        <LiveLeagueRow key={league.hash} league={league} onLive={onLive} />
      ))}
    </View>
  );
}
