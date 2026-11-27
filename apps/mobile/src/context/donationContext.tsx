import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Alert, Text, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import FundingTracker from '~/components/sys/donation/fundingTracker';
import { useDonationStatus, useFunding, useOptOut, useThankDonations } from '~/hooks/user/useFunding';
import { useLeagues } from '~/hooks/user/useLeagues';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type SurveySeason, useSurveyAnswers } from '~/hooks/user/useSurveyAnswers';
import SeasonSurvey from '~/components/sys/survey/seasonSurvey';
import { type SurveyFinishResult } from '~/types/survey';

export const BUY_ME_A_COFFEE_URL = 'https://www.buymeacoffee.com/aidanweinberg';
const ASKED_SESSION_KEY = 'donation_alert_session';
// Per season, so the season end ask only shows once
const SEASON_END_KEY_PREFIX = 'donation_season_end_';
// After they come back from Buy Me a Coffee, watch for the webhook
const WATCH_POLL_MS = 5000;
const WATCH_MS = 2 * 60 * 1000;

type DonationView = 'ask' | 'survey' | 'seasonEnd' | 'thanks';

type DonationContextValue = {
  // Open Buy Me a Coffee, then watch for their tip when the user comes back
  startDonation: () => void;
  // Ask about a finished season, then maybe for support toward the next one.
  // False if something else is showing, so nothing was asked.
  askSurvey: (_season: SurveySeason) => boolean;
  // Whether this modal is showing or waiting to show
  modalOpen: boolean;
  // Another modal is up, so hold this one until it closes
  setOtherModalOpen: (_open: boolean) => void;
};

const DonationContext = createContext<DonationContextValue>({
  startDonation: () => undefined,
  askSurvey: () => false,
  modalOpen: false,
  setOtherModalOpen: () => undefined,
});

/**
 * Asks for donations toward running costs once per login, for users with an
 * active league who haven't donated or opted out this season. Thanks them once
 * Buy Me a Coffee tells us about a tip from their email.
 * At the end of a season, asks league members a short survey, then if they plan
 * to play again, thanks them and asks for next season.
 */
export function DonationProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, sessionId } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: funding, refetch: refetchFunding } = useFunding();
  const { data: status, refetch: refetchStatus } = useDonationStatus();
  const { mutate: markThanked } = useThankDonations();
  const { mutate: optOut } = useOptOut();
  const postData = useFetch('POST');

  const [view, setView] = useState<DonationView | null>(null);
  const [thankedAmount, setThankedAmount] = useState(0);
  const [watching, setWatching] = useState(false);
  const [otherModalOpen, setOtherModalOpen] = useState(false);
  const viewRef = useRef(view);
  viewRef.current = view;

  const [surveySeason, setSurveySeason] = useState<SurveySeason | null>(null);
  const surveyAnswers = useSurveyAnswers(surveySeason?.seasonId ?? null);
  const { flush: flushSurvey, reset: resetSurvey } = surveyAnswers;
  const [finishingSurvey, setFinishingSurvey] = useState(false);
  const finishingRef = useRef(false);

  const unmet = useMemo(() => funding?.goals.filter((goal) => !goal.fulfilled) ?? [], [funding]);
  const unthanked = status?.unthanked ?? null;

  // Once per login, until they donate or say don’t ask again this season, only if they have an active league
  useEffect(() => {
    if (!isSignedIn || !sessionId || !funding || !status) return;
    const hasActiveLeague = leagues?.some(({ league }) => league.status === 'Active');
    if (!hasActiveLeague || status.donatedThisSeason || status.optedOut) return;
    void (async () => {
      if (await AsyncStorage.getItem(ASKED_SESSION_KEY) === sessionId) return;
      await AsyncStorage.setItem(ASKED_SESSION_KEY, sessionId);
      setView('ask');
    })();
  }, [isSignedIn, sessionId, funding, status, leagues]);

  // A tip from them came in: thank them over anything else, until dismissed
  useEffect(() => {
    if (unthanked === null) return;
    setThankedAmount(unthanked);
    setView('thanks');
    setWatching(false);
    void refetchFunding();
  }, [unthanked, refetchFunding]);

  // Back from Buy Me a Coffee: the webhook may take a moment
  useEffect(() => {
    if (!watching) return;
    void refetchStatus();
    // eslint-disable-next-line no-undef
    const poll = setInterval(() => void refetchStatus(), WATCH_POLL_MS);
    // eslint-disable-next-line no-undef
    const stop = setTimeout(() => setWatching(false), WATCH_MS);
    return () => {
      // eslint-disable-next-line no-undef
      clearInterval(poll);
      // eslint-disable-next-line no-undef
      clearTimeout(stop);
    };
  }, [watching, refetchStatus]);

  const startDonation = useCallback(() => {
    setView(null);
    void (async () => {
      try {
        // eslint-disable-next-line no-undef
        await new Promise((resolve) => setTimeout(() => resolve(true), 350));
        // Resolves when the browser sheet closes
        await WebBrowser.openBrowserAsync(BUY_ME_A_COFFEE_URL, {
          presentationStyle: WebBrowser.WebBrowserPresentationStyle.POPOVER,
        });
        setWatching(true);
      } catch {
        Alert.alert('Unable to open link', 'Please visit buymeacoffee.com/aidanweinberg to support the app.');
      }
    })();
  }, []);

  // Don't cover up another view
  const askSurvey = useCallback((season: SurveySeason) => {
    if (viewRef.current !== null) return false;
    viewRef.current = 'survey';
    resetSurvey();
    setSurveySeason(season);
    setView('survey');
    return true;
  }, [resetSurvey]);

  /**
   * Save anything pending, mark the survey finished, then ask for support
   * toward next season if they plan to play and haven't been asked.
   */
  const finishSurvey = useCallback(async () => {
    if (!surveySeason || finishingRef.current) return;
    finishingRef.current = true;
    setFinishingSurvey(true);

    let askDonation = false;
    try {
      await flushSurvey();
      const res = await postData('/api/survey/finish', { body: { seasonId: surveySeason.seasonId } });
      if (res.ok) ({ askDonation } = (await res.json()) as SurveyFinishResult);
      else console.error('Failed to finish survey', res.status);
    } catch (error) {
      console.error('Failed to finish survey', error);
    }

    const askedKey = `${SEASON_END_KEY_PREFIX}${surveySeason.seasonId}`;
    const showSeasonEnd = askDonation && !!funding && !(await AsyncStorage.getItem(askedKey));
    if (showSeasonEnd) await AsyncStorage.setItem(askedKey, 'asked');
    setView((current) => (current === null || current === 'survey'
      ? (showSeasonEnd ? 'seasonEnd' : null)
      : current));
    setFinishingSurvey(false);
    finishingRef.current = false;
  }, [surveySeason, flushSurvey, postData, funding]);

  const value = useMemo(() => ({
    startDonation,
    askSurvey,
    modalOpen: view !== null,
    setOtherModalOpen,
  }), [startDonation, askSurvey, view]);
  const close = () => {
    // Closing the survey finishes it. It's already sliding away, so hide it while that saves
    if (view === 'survey') {
      setView((current) => (current === 'survey' ? null : current));
      void finishSurvey();
      return;
    }
    // Shown until dismissed, then never again for these donations
    if (view === 'thanks') markThanked();
    setView(null);
  };

  const topGoal = unmet[0];
  const [askTitle, askBody] = view === 'seasonEnd'
    ? ['Thanks for playing this season!',
      'We hope you had fun competing in your league. If you’d like to help keep Trial by Fire running and ad free for next season, would you chip in?']
    : status?.donatedBefore
      ? ['Thanks for your support last season!',
        'Your tip helped keep the app running. If you’re enjoying this season, would you chip in again?']
      : ['Help keep Trial by Fire ad free',
        'We want to keep the app ad free, but the free tiers of the services we use have limits, like short login sessions.'];
  const allCovered = (
    <Text className='text-sm text-muted-foreground'>
      Every goal is covered! Any more tips go toward future costs and new features.
    </Text>
  );

  return (
    <DonationContext.Provider value={value}>
      {children}
      <Modal
        visible={view !== null && (view === 'survey' || !!funding) && !otherModalOpen}
        onClose={close}>
        {view === 'survey' && surveySeason && (
          <SeasonSurvey
            season={surveySeason}
            answers={surveyAnswers}
            finishing={finishingSurvey}
            onFinish={() => void finishSurvey()} />
        )}

        {funding && (view === 'ask' || view === 'seasonEnd') && (
          <View className='gap-3'>
            <View className='gap-1'>
              <Text className='text-lg font-bold text-foreground'>{askTitle}</Text>
              <Text className='text-sm text-muted-foreground'>{askBody}</Text>
              {topGoal ? <Text className='text-sm text-muted-foreground'>{topGoal.description}</Text> : allCovered}
              <Text className='text-xs text-muted-foreground'>
                Tips are optional and don’t unlock any features.
              </Text>
            </View>
            <FundingTracker goals={unmet.length > 0 ? unmet : funding.goals} />
            <Button onPress={startDonation} className='w-full rounded-lg bg-primary px-4 py-3'>
              <Text className='text-center text-base font-semibold text-primary-foreground'>Buy me a coffee</Text>
            </Button>
            <View className='flex-row justify-center gap-6 pt-1'>
              <Button onPress={close}>
                <Text className='text-center text-xs text-muted-foreground'>Maybe later</Text>
              </Button>
              {view === 'ask' && status?.seasonId != null && (
                <Button
                  onPress={() => {
                    optOut();
                    close();
                  }}>
                  <Text className='text-center text-xs text-muted-foreground'>Don’t ask again this season</Text>
                </Button>
              )}
            </View>
          </View>
        )}

        {funding && view === 'thanks' && (
          <View className='gap-3'>
            <View className='gap-1'>
              <Text className='text-lg font-bold text-foreground'>Thank you!</Text>
              <Text className='text-sm text-muted-foreground'>
                We got your ${thankedAmount} tip. Thanks for supporting Trial by Fire!
              </Text>
              {unmet.length === 0
                ? allCovered
                : <Text className='text-sm text-muted-foreground'>Here’s where things stand:</Text>}
            </View>
            <FundingTracker goals={funding.goals} />
            <Button onPress={close} className='w-full rounded-lg bg-primary px-4 py-3'>
              <Text className='text-center text-base font-semibold text-primary-foreground'>Close</Text>
            </Button>
          </View>
        )}
      </Modal>
    </DonationContext.Provider>
  );
}

export function useDonation() {
  return useContext(DonationContext);
}
