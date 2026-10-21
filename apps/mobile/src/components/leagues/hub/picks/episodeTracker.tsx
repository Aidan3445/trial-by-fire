import { type ReactNode } from 'react';
import { View, Text } from 'react-native';
import ColorRow from '~/components/shared/colorRow';
import AirStatus from '~/components/shared/episodes/airStatus';
import { PointsIcon } from '~/components/icons/generated';
import { useEpisodeTracker } from '~/hooks/leagues/enrich/useEpisodeTracker';
import { colors, getPointsColor } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type PredictionStatus, type TrackedEvent } from '~/lib/scores';

const signed = (points: number) => (points > 0 ? `+${points}` : `${points}`);

function Points({ value, muted, size = 'base' }: { value: number; muted?: boolean; size?: 'sm' | 'base' | '2xl' }) {
  const color = muted ? colors.neutral! : getPointsColor(value)!;
  return (
    <View className='flex-row items-center gap-0.5'>
      <Text
        allowFontScaling={false}
        className={cn('font-bold', size === '2xl' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-base')}
        style={{ color }}>
        {signed(value)}
      </Text>
      <PointsIcon size={size === '2xl' ? 18 : 11} color={color} />
    </View>
  );
}

function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <View className='rounded-lg border-2 border-primary/20 bg-accent/50 p-2 gap-1.5'>
      <View className='flex-row items-center justify-between gap-2'>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground'>{title}</Text>
        {aside}
      </View>
      {children}
    </View>
  );
}

function EventRows({ events, empty }: { events: TrackedEvent[]; empty: string }) {
  if (events.length === 0) {
    return <Text className='text-base italic text-muted-foreground'>{empty}</Text>;
  }
  return (
    <View className='gap-0.5'>
      {events.map((event, index) => (
        <View key={`${event.eventSource}-${event.eventId ?? index}`} className='flex-row items-center justify-between gap-2'>
          <Text className='flex-1 text-base text-foreground' numberOfLines={1}>
            {event.label}
            {event.viaTribe && <Text className='text-sm text-muted-foreground'> (tribe)</Text>}
          </Text>
          <Points value={event.points} />
        </View>
      ))}
    </View>
  );
}

const STATUS_STYLES: Record<PredictionStatus, { box: string; text: string }> = {
  hit: { box: 'bg-positive', text: 'text-white' },
  miss: { box: 'bg-destructive', text: 'text-white' },
  pending: { box: 'bg-muted-foreground/20', text: 'text-muted-foreground' },
};

/**
  * Replaces the locked pick and prediction forms while an episode airs with a
  * running tally of what the member has earned in it.
  */
export default function EpisodeTracker() {
  const { tracker, castaways, tribes } = useEpisodeTracker();
  if (!tracker) return null;

  const castaway = (castawayId: number) => castaways?.find((c) => c.castawayId === castawayId);
  const referenceName = (type: 'Castaway' | 'Tribe', id: number) => type === 'Castaway'
    ? castaway(id)?.fullName ?? 'Unknown castaway'
    : tribes?.find((tribe) => tribe.tribeId === id)?.tribeName ?? 'Unknown tribe';

  const castawayRow = (castawayId: number) => {
    const c = castaway(castawayId);
    return (
      <ColorRow color={c?.tribe?.color ?? '#AAAAAA'}>
        <Text className='text-base font-bold text-foreground'>{c?.fullName ?? 'Unknown castaway'}</Text>
      </ColorRow>
    );
  };

  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2 w-full'>
      <View className='flex-row items-center justify-between gap-2 px-1'>
        <View className='flex-row items-center gap-2 flex-1'>
          <View className='h-10 w-1 rounded-full bg-primary' />
          <View className='flex-1'>
            <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
              This Episode
            </Text>
            <View className='flex-row items-center gap-1'>
              <AirStatus
                airDate={tracker.episode.airDate}
                airStatus={tracker.episode.airStatus}
                showDate={false} />
              <Text className='text-sm text-muted-foreground flex-1' numberOfLines={1}>
                {tracker.episode.episodeNumber}: {tracker.episode.title}
              </Text>
            </View>
          </View>
        </View>
        <Points value={tracker.total} size='2xl' />
      </View>

      <Section title='Your Survivor' aside={tracker.pick && <Points value={tracker.pick.points} />}>
        {tracker.pick ? (
          <>
            {castawayRow(tracker.pick.castawayId)}
            <EventRows events={tracker.pick.events} empty='No points yet this episode' />
          </>
        ) : (
          <Text className='text-base italic text-muted-foreground'>No survivor picked for this episode</Text>
        )}
        {tracker.shotInTheDark && (
          <Text className='text-sm font-bold text-primary'>Shot in the Dark is protecting your streak</Text>
        )}
      </Section>

      {tracker.secondary && (
        <Section
          title='Secondary Pick'
          aside={
            <View className='flex-row items-center gap-1.5'>
              <View className='rounded-md bg-primary/15 px-1.5'>
                <Text className='text-sm font-bold text-primary'>×{tracker.secondary.multiplier}</Text>
              </View>
              <Points value={tracker.secondary.points} />
            </View>
          }>
          {castawayRow(tracker.secondary.castawayId)}
          <EventRows events={tracker.secondary.events} empty='No points yet this episode' />
          {tracker.secondary.events.length > 0 && (
            <Text className='text-sm text-muted-foreground'>
              {signed(tracker.secondary.basePoints)} × {tracker.secondary.multiplier} = {signed(tracker.secondary.points)}
            </Text>
          )}
        </Section>
      )}

      {tracker.predictions.length > 0 && (
        <Section title='Predictions'>
          <View className='gap-1'>
            {tracker.predictions.map((prediction) => (
              <View key={`${prediction.eventSource}-${prediction.predictionId}`}>
                <View className='flex-row items-center justify-between gap-2'>
                  <Text className='flex-1 text-base text-foreground' numberOfLines={1}>
                    <Text className='font-medium'>{prediction.label}:</Text>{' '}
                    {referenceName(prediction.reference.type, prediction.reference.id)}
                  </Text>
                  <View className={cn('rounded-md px-1.5', STATUS_STYLES[prediction.status].box)}>
                    <Text className={cn('text-xs font-bold uppercase', STATUS_STYLES[prediction.status].text)}>
                      {prediction.status}
                    </Text>
                  </View>
                  <Points
                    value={prediction.status === 'miss' ? 0 : prediction.points}
                    muted={prediction.status === 'pending'} />
                </View>
                {prediction.bet !== null && (
                  <View className='flex-row items-center justify-end gap-1'>
                    <Text className='text-sm text-muted-foreground'>
                      Bet {prediction.bet}{prediction.status === 'pending' ? ' at stake' : ''}
                    </Text>
                    {prediction.status !== 'pending' && <Points value={prediction.betResult} size='sm' />}
                  </View>
                )}
              </View>
            ))}
          </View>
        </Section>
      )}

      {tracker.survivalBonus > 0 && (
        <View className='flex-row items-center justify-end gap-1 px-1'>
          <Text className='text-base text-muted-foreground'>Survival streak bonus</Text>
          <Points value={tracker.survivalBonus} />
        </View>
      )}
    </View>
  );
}
