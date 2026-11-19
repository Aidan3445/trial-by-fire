import { useEffect } from 'react';
import { askSeasonSurvey } from '~/components/sys/donation/startDonation';
import { type League } from '~/types/leagues';
import { type Season } from '~/types/seasons';
import { type SeasonSurvey, SURVEY_DELAY_MS, SURVEY_RECENT_FINALE_MS } from '~/types/survey';

const ASKED_KEY_PREFIX = 'season-survey-';

/**
  * Asks for feedback on the season once, a minute into viewing a finished
  * league's podium. The survey then leads into the season end donation ask.
  * @param season The league's season
  * @param league The league
  */
export function useSeasonSurvey(season?: Season, league?: League) {
  const seasonId = season?.seasonId;
  const seasonName = season?.name;
  const finaleTime = season?.finaleDate ? new Date(season.finaleDate).getTime() : undefined;
  const finished = league?.status === 'Inactive' && !league.neverDrafted;

  useEffect(() => {
    if (!finished || seasonId === undefined || !seasonName || finaleTime === undefined) return;
    const sinceFinale = Date.now() - finaleTime;
    if (sinceFinale < 0 || sinceFinale > SURVEY_RECENT_FINALE_MS) return;

    const key = `${ASKED_KEY_PREFIX}${seasonId}`;
    try {
      if (localStorage.getItem(key)) return;
    } catch {
      // Storage blocked: the server still knows if they were asked
    }

    const timer = setTimeout(() => {
      void (async () => {
        // Shown on another device already?
        const res = await fetch(`/api/survey?seasonId=${seasonId}`, { cache: 'no-store' });
        if (!res.ok) return;
        const { survey } = await res.json() as { survey: SeasonSurvey | null };
        try {
          localStorage.setItem(key, 'asked');
        } catch {
          // Storage blocked: the server still knows
        }
        if (survey) return;
        // Record that it was shown so it isn't shown again anywhere
        await fetch('/api/survey', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seasonId }),
        });
        askSeasonSurvey({ seasonId, seasonName });
      })().catch((e) => console.error('Failed to check the season survey', e));
    }, SURVEY_DELAY_MS);
    return () => clearTimeout(timer);
  }, [finished, seasonId, seasonName, finaleTime]);
}
