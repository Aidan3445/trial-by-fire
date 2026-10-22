import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Alert, Text, TextInput, View } from 'react-native';
import { useAuth } from '@clerk/expo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import FundingTracker from '~/components/sys/donation/fundingTracker';
import { useDonationStatus, useFunding, useReportDonation } from '~/hooks/user/useFunding';
import { useLeagues } from '~/hooks/user/useLeagues';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';

export const BUY_ME_A_COFFEE_URL = 'https://www.buymeacoffee.com/aidanweinberg';
const ASKED_SESSION_KEY = 'donation_alert_session';
const QUICK_AMOUNTS = [3, 5, 10];

type DonationContextValue = {
  /** Open Buy Me a Coffee, then ask how it went when the user comes back */
  startDonation: () => void;
};

const DonationContext = createContext<DonationContextValue>({ startDonation: () => undefined });

/**
 * Asks for donations toward running costs once per login, for users with an
 * active league who haven't donated this season. When someone comes back from
 * Buy Me a Coffee, asks whether they donated and shows what's covered.
 */
export function DonationProvider({ children }: { children: ReactNode }) {
  const { isSignedIn, sessionId } = useAuth();
  const { data: leagues } = useLeagues();
  const { data: funding } = useFunding();
  const { data: status } = useDonationStatus();
  const report = useReportDonation();
  const { reset: resetReport } = report;

  const [view, setView] = useState<'ask' | 'report' | null>(null);
  const [amount, setAmount] = useState('');
  const [fundingId, setFundingId] = useState<number | null>(null);

  const unmet = useMemo(() => funding?.goals.filter((goal) => !goal.fulfilled) ?? [], [funding]);

  // Once per login, until they report a donation this season, only if they have an active league
  useEffect(() => {
    if (!isSignedIn || !sessionId || !funding || !status) return;
    const hasActiveLeague = leagues?.some(({ league }) => league.status === 'Active');
    if (!hasActiveLeague || unmet.length === 0 || status.donatedThisSeason) return;
    void (async () => {
      if (await AsyncStorage.getItem(ASKED_SESSION_KEY) === sessionId) return;
      await AsyncStorage.setItem(ASKED_SESSION_KEY, sessionId);
      setView('ask');
    })();
  }, [isSignedIn, sessionId, funding, status, leagues, unmet.length]);

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
        resetReport();
        setAmount('');
        setView('report');
      } catch {
        Alert.alert('Unable to open link', 'Please visit buymeacoffee.com/aidanweinberg to support the app.');
      }
    })();
  }, [resetReport]);

  const value = useMemo(() => ({ startDonation }), [startDonation]);
  const close = () => setView(null);

  const topGoal = unmet[0] ?? funding?.goals[0];
  const amountValue = Number(amount);
  const validAmount = Number.isFinite(amountValue) && amountValue > 0 && amountValue <= 1000;
  const chooseGoal = unmet.length > 1;
  const chosenGoal = chooseGoal ? (fundingId ?? unmet[0]!.fundingId) : undefined;

  return (
    <DonationContext.Provider value={value}>
      {children}
      <Modal visible={view !== null && !!funding} onClose={close}>
        {funding && view === 'ask' && (
          <View className='gap-3'>
            <View className='gap-1'>
              <Text className='text-lg font-bold text-foreground'>
                {status?.donatedBefore ? 'Thanks for your support last season!' : 'Help keep Trial by Fire ad free'}
              </Text>
              <Text className='text-sm text-muted-foreground'>
                {status?.donatedBefore
                  ? 'Your tip helped keep the app running. If you’re enjoying this season, would you chip in again?'
                  : 'We want to keep the app ad free, but the free tiers of the services we use have limits, like short login sessions.'}
              </Text>
              {topGoal && <Text className='text-sm text-muted-foreground'>{topGoal.description}</Text>}
              <Text className='text-xs text-muted-foreground'>
                Tips are optional and don’t unlock any features.
              </Text>
            </View>
            <FundingTracker goals={unmet.length > 0 ? unmet : funding.goals} />
            <Button onPress={startDonation} className='w-full rounded-lg bg-primary px-4 py-3'>
              <Text className='text-center text-base font-semibold text-primary-foreground'>Buy me a coffee</Text>
            </Button>
            <Button onPress={close} className='w-full pt-1'>
              <Text className='text-center text-xs text-muted-foreground'>Maybe later</Text>
            </Button>
          </View>
        )}

        {funding && view === 'report' && report.isSuccess && (
          <View className='gap-3'>
            <View className='gap-1'>
              <Text className='text-lg font-bold text-foreground'>Thank you!</Text>
              <Text className='text-sm text-muted-foreground'>Here’s where things stand:</Text>
            </View>
            <FundingTracker goals={funding.goals} />
            <Button onPress={close} className='w-full rounded-lg bg-primary px-4 py-3'>
              <Text className='text-center text-base font-semibold text-primary-foreground'>Close</Text>
            </Button>
          </View>
        )}

        {funding && view === 'report' && !report.isSuccess && (
          <View className='gap-3'>
            <View className='gap-1'>
              <Text className='text-lg font-bold text-foreground'>Thanks for stopping by!</Text>
              <Text className='text-sm text-muted-foreground'>
                Did you leave a tip? Let us know how much so we can track what’s covered.
              </Text>
            </View>
            <View className='flex-row items-center gap-2'>
              {QUICK_AMOUNTS.map((quick) => (
                <Button
                  key={quick}
                  onPress={() => setAmount(`${quick}`)}
                  className={cn(
                    'rounded-lg border-2 px-3 py-1.5',
                    amountValue === quick ? 'border-primary bg-primary' : 'border-primary/30 bg-primary/5')}>
                  <Text className={cn('text-base font-bold', amountValue === quick ? 'text-primary-foreground' : 'text-primary')}>
                    ${quick}
                  </Text>
                </Button>
              ))}
              <TextInput
                className='flex-1 rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-base leading-5'
                placeholder='Other $'
                placeholderTextColor={colors.mutedForeground}
                keyboardType='decimal-pad'
                value={amount}
                onChangeText={setAmount} />
            </View>
            {chooseGoal && (
              <View className='gap-1'>
                <Text className='text-sm font-bold text-foreground'>Where should it go?</Text>
                {unmet.map((goal) => (
                  <Button
                    key={goal.fundingId}
                    onPress={() => setFundingId(goal.fundingId)}
                    className='flex-row items-center gap-2'>
                    <View className={cn(
                      'size-4 rounded-full border-2 border-primary',
                      chosenGoal === goal.fundingId && 'bg-primary')} />
                    <Text className='text-sm text-foreground'>{goal.name}</Text>
                  </Button>
                ))}
              </View>
            )}
            <FundingTracker goals={funding.goals} />
            {report.isError && <Text className='text-sm text-destructive'>{report.error.message}</Text>}
            <Button
              disabled={!validAmount || report.isPending}
              onPress={() => report.mutate({ amount: amountValue, fundingId: chosenGoal })}
              className={cn('w-full rounded-lg bg-primary px-4 py-3', (!validAmount || report.isPending) && 'opacity-50')}>
              <Text className='text-center text-base font-semibold text-primary-foreground'>
                {report.isPending ? 'Saving...' : validAmount ? `I tipped $${amountValue}` : 'I tipped'}
              </Text>
            </Button>
            <Button onPress={close} className='w-full pt-1'>
              <Text className='text-center text-xs text-muted-foreground'>I didn’t this time</Text>
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
