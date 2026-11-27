import { useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDonation } from '~/context/donationContext';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type League } from '~/types/leagues';
import { type Season } from '~/types/seasons';
import { SURVEY_DELAY_MS, SURVEY_RECENT_FINALE_MS, type SeasonSurvey } from '~/types/survey';

const SHOWN_KEY_PREFIX = 'survey_season_';

/**
 * Asks about a finished season once, SURVEY_DELAY_MS into viewing one of its
 * leagues, if they haven't seen the survey on any device.
 * @param season The league's season
 * @param league The league being viewed
 */
export function useSeasonSurvey(season?: Season, league?: League) {
  const { askSurvey } = useDonation();
  const getData = useFetch();
  const putData = useFetch('PUT');
  const fetchRef = useRef({ getData, putData });
  fetchRef.current = { getData, putData };

  const seasonId = season?.seasonId;
  const seasonName = season?.name;
  const finaleTime = season?.finaleDate ? new Date(season.finaleDate).getTime() : undefined;
  const eligible = league?.status === 'Inactive' && !league.neverDrafted;

  useEffect(() => {
    if (!eligible || seasonId === undefined || seasonName === undefined || finaleTime === undefined) return;
    const sinceFinale = Date.now() - finaleTime;
    if (sinceFinale < 0 || sinceFinale > SURVEY_RECENT_FINALE_MS) return;

    const key = `${SHOWN_KEY_PREFIX}${seasonId}`;
    // eslint-disable-next-line no-undef
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    void (async () => {
      if (await AsyncStorage.getItem(key) || cancelled) return;
      // eslint-disable-next-line no-undef
      timer = setTimeout(() => {
        void (async () => {
          try {
            const res = await fetchRef.current.getData(`/api/survey?seasonId=${seasonId}`);
            if (!res.ok || cancelled) return;
            const { survey } = (await res.json()) as { survey: SeasonSurvey | null };
            // Already seen, maybe on another device
            if (survey) {
              await AsyncStorage.setItem(key, 'shown');
              return;
            }
            // Something else is up; try again next visit
            if (cancelled || !askSurvey({ seasonId, name: seasonName })) return;
            await AsyncStorage.setItem(key, 'shown');
            await fetchRef.current.putData('/api/survey', { body: { seasonId } });
          } catch (error) {
            console.error('Failed to check the season survey', error);
          }
        })();
      }, SURVEY_DELAY_MS);
    })();
    return () => {
      cancelled = true;
      // eslint-disable-next-line no-undef
      clearTimeout(timer);
    };
  }, [eligible, seasonId, seasonName, finaleTime, askSurvey]);
}
