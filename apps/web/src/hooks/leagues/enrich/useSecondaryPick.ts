'use client';

import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useLeagueActionDetails } from '~/hooks/leagues/enrich/useLeagueActionDetails';
import makeSecondaryPick from '~/actions/makeSecondaryPick';
import { MAX_SEASON_LENGTH } from '~/lib/leagues';

/** Fired to bring the weekly picks carousel to the secondary pick slide */
export const FOCUS_SECONDARY_PICK_EVENT = 'focus-secondary-pick';

/**
 * Secondary pick state for the logged in member and the next episode:
 * which castaways they can choose, what they already chose, and how to submit.
 */
export function useSecondaryPick() {
  const queryClient = useQueryClient();
  const {
    league,
    rules,
    actionDetails,
    keyEpisodes,
    leagueMembers,
    membersWithPicks,
    selectionTimeline,
  } = useLeagueActionDetails();

  const settings = rules?.secondaryPick;
  const memberId = leagueMembers?.loggedIn?.memberId;
  const nextEpisode = keyEpisodes?.nextEpisode ?? null;

  const active = !!settings?.enabled
    && !!nextEpisode
    && !!memberId
    && league?.status !== 'Inactive'
    && keyEpisodes?.previousEpisode?.airStatus !== 'Airing';

  // membersWithPicks is empty until the selection timeline loads
  const loaded = membersWithPicks.length > 0;
  const currentPickId = membersWithPicks
    .find((mwp) => mwp.member.memberId === memberId)?.secondary?.castawayId ?? null;

  const lockouts = useMemo(() => {
    const lockoutMap = new Map<number, { episodePicked: number; episodesRemaining?: number }>();
    if (!settings?.enabled || !memberId || !selectionTimeline?.secondaryPicks || !keyEpisodes?.previousEpisode) {
      return lockoutMap;
    }

    const lockoutPeriod = settings.lockoutPeriod;
    const previousEpisode = keyEpisodes.previousEpisode.episodeNumber;
    const secondaryPicks = selectionTimeline.secondaryPicks[memberId] ?? [];

    secondaryPicks.forEach((castawayId, episodeNumber) => {
      if (castawayId === null || castawayId === undefined) return;
      const episodesSinceLastPick = previousEpisode - episodeNumber;
      if ((lockoutPeriod === 0 || episodesSinceLastPick < lockoutPeriod) && episodeNumber <= previousEpisode) {
        if ((lockoutMap.get(castawayId)?.episodePicked ?? -1) < episodeNumber) {
          lockoutMap.set(castawayId, {
            episodePicked: episodeNumber,
            episodesRemaining: lockoutPeriod === MAX_SEASON_LENGTH
              ? undefined
              : Math.max(0, lockoutPeriod - episodesSinceLastPick),
          });
        }
      }
    });

    return lockoutMap;
  }, [settings, memberId, selectionTimeline, keyEpisodes]);

  const options = useMemo(() =>
    Object.values(actionDetails ?? {})
      .flatMap(({ castaways }) => castaways.map(({ castaway, member }) => ({ ...castaway, pickedBy: member })))
      .filter((castaway) => !castaway.eliminatedEpisode
        || castaway.redemption?.some((r) => r.secondEliminationEpisode === null))
      .map((castaway) => {
        const isOwnSurvivor = !settings?.canPickOwnSurvivor && castaway.pickedBy?.memberId === memberId;
        const lockout = lockouts.get(castaway.castawayId);

        let disabledReason: string | null = null;
        if (isOwnSurvivor) {
          disabledReason = 'Your Survivor';
        } else if (lockout) {
          const { episodesRemaining, episodePicked } = lockout;
          disabledReason = episodesRemaining !== undefined && episodesRemaining > 0
            ? `unavailable for ${episodesRemaining} more ${episodesRemaining === 1 ? 'episode' : 'episodes'}`
            : `Picked Ep ${episodePicked}`;
        }

        return { castaway, disabledReason };
      }),
    [actionDetails, settings, memberId, lockouts]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const submit = useCallback(async (castawayId: number) => {
    if (!league || !nextEpisode) return false;
    setIsSubmitting(true);
    try {
      await makeSecondaryPick(league.hash, castawayId);
      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', league.hash] });
      alert('Secondary pick chosen successfully');
      return true;
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to choose secondary pick');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [league, nextEpisode, queryClient]);

  const description = useMemo(() => {
    if (!settings || !nextEpisode) return '';
    const parts = [
      `Earn ${settings.multiplier === 1 ? '' : `${settings.multiplier * 100}% of `}the points your pick scores in episode ${nextEpisode.episodeNumber}.`,
    ];
    if (!settings.canPickOwnSurvivor) parts.push('It can\'t be your survivor.');
    if (settings.lockoutPeriod === MAX_SEASON_LENGTH) {
      parts.push('No repeats this season.');
    } else if (settings.lockoutPeriod > 0) {
      parts.push(`A pick can't be repeated for ${settings.lockoutPeriod} episode${settings.lockoutPeriod === 1 ? '' : 's'}.`);
    }
    return parts.join(' ');
  }, [settings, nextEpisode]);

  return {
    active,
    description,
    loaded,
    settings,
    nextEpisode,
    currentPickId,
    hasPick: currentPickId !== null,
    options,
    submit,
    isSubmitting,
  };
}
