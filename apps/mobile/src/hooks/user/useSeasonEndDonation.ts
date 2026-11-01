import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDonation } from '~/context/donationContext';
import { type LeagueStatus } from '~/types/leagues';
import { type Season } from '~/types/seasons';

const ASKED_KEY_PREFIX = 'donation_season_end_';
const DELAY_MS = 30 * 1000;
// Only the season that just ended, not leagues from years ago
const RECENT_FINALE_MS = 90 * 24 * 60 * 60 * 1000;

/**
 * Asks for support toward next season once per season, 30 seconds into
 * viewing a finished league's podium.
 * @param season The league's season
 * @param leagueStatus The league's status
 */
export function useSeasonEndDonation(season?: Season, leagueStatus?: LeagueStatus) {
  const { askSeasonEnd } = useDonation();
  const seasonId = season?.seasonId;
  const finaleTime = season?.finaleDate?.getTime();

  useEffect(() => {
    if (leagueStatus !== 'Inactive' || seasonId === undefined || finaleTime === undefined) return;
    const sinceFinale = Date.now() - finaleTime;
    if (sinceFinale < 0 || sinceFinale > RECENT_FINALE_MS) return;

    const key = `${ASKED_KEY_PREFIX}${seasonId}`;
    // eslint-disable-next-line no-undef
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    void (async () => {
      if (await AsyncStorage.getItem(key) || cancelled) return;
      // eslint-disable-next-line no-undef
      timer = setTimeout(() => {
        void AsyncStorage.setItem(key, 'asked');
        askSeasonEnd();
      }, DELAY_MS);
    })();
    return () => {
      cancelled = true;
      // eslint-disable-next-line no-undef
      clearTimeout(timer);
    };
  }, [leagueStatus, seasonId, finaleTime, askSeasonEnd]);
}
