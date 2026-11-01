import { useEffect } from 'react';
import { askSeasonEndDonation } from '~/components/sys/donation/startDonation';
import { type LeagueStatus } from '~/types/leagues';
import { type Season } from '~/types/seasons';

const ASKED_KEY_PREFIX = 'donation-season-end-';
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
  const seasonId = season?.seasonId;
  const finaleTime = season?.finaleDate?.getTime();

  useEffect(() => {
    if (leagueStatus !== 'Inactive' || seasonId === undefined || finaleTime === undefined) return;
    const sinceFinale = Date.now() - finaleTime;
    if (sinceFinale < 0 || sinceFinale > RECENT_FINALE_MS) return;

    const key = `${ASKED_KEY_PREFIX}${seasonId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // Storage blocked: ask anyway
    }

    const timer = setTimeout(() => {
      try {
        localStorage.setItem(key, 'asked');
      } catch {
        // Storage blocked: they may be asked again
      }
      askSeasonEndDonation();
    }, DELAY_MS);
    return () => clearTimeout(timer);
  }, [leagueStatus, seasonId, finaleTime]);
}
