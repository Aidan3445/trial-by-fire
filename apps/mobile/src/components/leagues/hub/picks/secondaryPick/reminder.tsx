import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { useSecondaryPick } from '~/hooks/leagues/mutation/useSecondaryPick';
import SecondaryPickForm from '~/components/leagues/hub/picks/secondaryPick/form';

/** Nudges members who haven't made this week's secondary pick, and lets them make it in place */
export default function SecondaryPickReminder() {
  const { active, loaded, hasPick, nextEpisode } = useSecondaryPick();
  const [open, setOpen] = useState(false);

  if (!active || !loaded || hasPick || nextEpisode?.airStatus !== 'Upcoming') return null;

  const locks = new Date(nextEpisode.airDate).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <View className='rounded-xl border-2 border-amber-400 bg-amber-400/15 overflow-hidden'>
      <Pressable
        onPress={() => setOpen((prev) => !prev)}
        accessibilityRole='button'
        accessibilityState={{ expanded: open }}
        className='flex-row items-center gap-2 px-3 py-2'>
        <View className='size-2 rounded-full bg-amber-400' />
        <View className='flex-1'>
          <Text className='text-base font-bold text-foreground'>
            No secondary pick for episode {nextEpisode.episodeNumber}
          </Text>
          <Text className='text-sm text-muted-foreground'>Locks {locks}</Text>
        </View>
        <Text className='text-sm font-bold uppercase tracking-wider text-primary'>
          {open ? 'Close' : 'Pick now'}
        </Text>
      </Pressable>
      {open && <SecondaryPickForm className='pt-0' />}
    </View>
  );
}
