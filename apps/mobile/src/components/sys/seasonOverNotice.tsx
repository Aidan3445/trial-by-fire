import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import { useDonation } from '~/context/donationContext';
import { useOffseason } from '~/hooks/user/useOffseason';

const SHOWN_SESSION_KEY = 'season_over_notice_session';

/**
 * Between seasons, once per login: the season is over, when the next one
 * premieres, and that they can already start a league.
 */
export default function SeasonOverNotice() {
  const router = useRouter();
  const { isSignedIn, sessionId } = useAuth();
  const { data: offseason, isFetchedAfterMount } = useOffseason();
  const { modalOpen, setOtherModalOpen } = useDonation();
  const [show, setShow] = useState(false);

  // Wait for a fresh status, and don't stack on another modal
  useEffect(() => {
    if (!isSignedIn || !sessionId || !isFetchedAfterMount || !offseason?.showNotice || modalOpen) return;
    let cancelled = false;
    void (async () => {
      if (await AsyncStorage.getItem(SHOWN_SESSION_KEY) === sessionId || cancelled) return;
      await AsyncStorage.setItem(SHOWN_SESSION_KEY, sessionId);
      setOtherModalOpen(true);
      setShow(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [isSignedIn, sessionId, isFetchedAfterMount, offseason?.showNotice, modalOpen, setOtherModalOpen]);

  const dismiss = () => {
    setShow(false);
    setOtherModalOpen(false);
  };

  const goToLeagues = () => {
    dismiss();
    router.navigate('/(protected)/(tabs)/leagues');
  };

  if (!offseason) return null;
  const { endedSeason, nextSeason, history } = offseason;

  const title = history === 'played' && endedSeason
    ? `Thanks for playing ${endedSeason.name}!`
    : history === 'unstarted'
      ? 'Welcome back!'
      : 'Welcome to Trial by Fire!';
  const premiere = nextSeason
    ? new Date(nextSeason.premiereDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    : null;

  return (
    <Modal visible={show} onClose={dismiss}>
      <View className='gap-3'>
        <View className='gap-1'>
          <Text className='text-lg font-bold text-foreground'>{title}</Text>
          <Text className='text-sm text-muted-foreground'>
            {endedSeason ? `${endedSeason.name} is over. ` : 'The season is over. '}
            {nextSeason && premiere
              ? `${nextSeason.name} premieres ${premiere}, so check back closer to then.`
              : 'Check back closer to next season’s premiere.'}
          </Text>
          {nextSeason && (
            <Text className='text-sm text-muted-foreground'>
              Can’t wait? You can already start a league and invite friends.
            </Text>
          )}
        </View>
        <Button onPress={dismiss} className='w-full rounded-lg bg-primary px-4 py-3'>
          <Text className='text-center text-base font-semibold text-primary-foreground'>Got it</Text>
        </Button>
        {nextSeason && (
          <Button onPress={goToLeagues} className='self-center pt-1'>
            <Text className='text-center text-xs text-muted-foreground'>Go to my leagues</Text>
          </Button>
        )}
      </View>
    </Modal>
  );
}
