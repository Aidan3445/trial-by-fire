import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLeagueActionDetails } from '~/hooks/leagues/enrich/useActionDetails';
import { useEliminations } from '~/hooks/seasons/useEliminations';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMember } from '~/types/leagueMembers';
import * as StoreReview from 'expo-store-review';

const formSchema = z.object({
  castawayId: z.coerce.number({ required_error: 'Please select a castaway' }),
});

type FormValues = z.infer<typeof formSchema>;

export function useChangeCastaway() {
  const queryClient = useQueryClient();
  const postCastaway = useFetch('POST');

  const {
    league,
    actionDetails,
    keyEpisodes,
    leagueMembers,
    membersWithPicks,
  } = useLeagueActionDetails();

  const { data: eliminations } = useEliminations(league?.seasonId ?? null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const [selected, setSelected] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closedDialog, setClosedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableCastaways = useMemo(() =>
    Object.values(actionDetails ?? {})
      .flatMap(({ castaways }) =>
        castaways.map(({ castaway, member }) => ({
          ...castaway,
          pickedBy: member,
        }))
      ),
    [actionDetails]
  );

  const { pickPriority, elim } = useMemo(() => {
    return membersWithPicks.reduce(
      ({ pickPriority, elim }, memberWPick) => {
        const pickId = memberWPick.castawayId;
        const eliminatedEpisode =
          eliminations?.findIndex((elims) =>
            elims.some((elim) => elim.castawayId === pickId)
          ) ?? -1;

        if (eliminatedEpisode === -1) return { pickPriority, elim };

        if (keyEpisodes?.previousEpisode?.episodeNumber === eliminatedEpisode) {
          pickPriority.push(memberWPick.member);
        }
        elim.push(memberWPick.member);
        return { pickPriority, elim };
      },
      { pickPriority: [], elim: [] } as { pickPriority: LeagueMember[]; elim: LeagueMember[] }
    );
  }, [eliminations, keyEpisodes, membersWithPicks]);

  // Open elimination dialog if logged-in member's castaway was just eliminated
  useEffect(() => {
    if (leagueMembers?.loggedIn && elim.some(m => m.memberId === leagueMembers.loggedIn?.memberId)) {
      setDialogOpen(true);
    }
  }, [elim, leagueMembers]);

  // Set initial primary pick
  useEffect(() => {
    if (!leagueMembers?.loggedIn) return;
    const memberId = leagueMembers.loggedIn.memberId;
    const currentPick = membersWithPicks.find(mwp => mwp.member.memberId === memberId && !mwp.out);
    if (currentPick) {
      setSelected(`${currentPick.castawayId}`);
      form.setValue('castawayId', currentPick.castawayId);
    }
  }, [leagueMembers, membersWithPicks, form]);

  const handleSelectionChange = (value: string) => {
    setSelected(value);
    form.setValue('castawayId', parseInt(value));
  };

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!league) return { success: false };

    setIsSubmitting(true);
    try {
      const response = await postCastaway(`/api/leagues/${league.hash}/chooseCastaway`, {
        body: { castawayId: data.castawayId },
      });

      if (!response.ok) throw new Error('Failed to choose castaway');

      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', league.hash] });
      await queryClient.invalidateQueries({ queryKey: ['leagueMembers', league.hash] });
      form.reset();
      setSelected('');
      Alert.alert('Success', 'Castaway chosen successfully');

      if (await StoreReview.hasAction()) {
        await StoreReview.requestReview();
      }
      return { success: true };
    } catch {
      Alert.alert('Error', 'Failed to choose castaway');
      return { success: false };
    } finally {
      setIsSubmitting(false);
    }
  });

  const markDialogClosed = async () => {
    setClosedDialog(true);
    setDialogOpen(false);
  };

  // Matches web: 48h window + episode runtime
  const priorityTimeLeft = useMemo(() => {
    if (!keyEpisodes?.previousEpisode) return -1;
    const elapsed = Date.now() - keyEpisodes.previousEpisode.airDate.getTime();
    return Math.floor(
      (1000 * 60 * 60 * 48 - elapsed) / 1000 / 60 / 60
      + (keyEpisodes.previousEpisode.runtime / 60)
    );
  }, [keyEpisodes]);

  const loggedInMemberId = leagueMembers?.loggedIn?.memberId;

  const uiState = useMemo(() => {
    if (league?.status === 'Inactive') return 'inactive';

    // Castaways are listed for the next episode, so with none scheduled the list is empty, not taken
    // After the finale there is no next episode to wait for
    const seasonOver = !!keyEpisodes?.previousEpisode?.isFinale;
    if (keyEpisodes && !keyEpisodes.nextEpisode && !seasonOver) return 'no-episode';
    if ((availableCastaways.length > 0 || seasonOver) && availableCastaways.every((c) => c.pickedBy)) return 'no-castaways';

    if (
      keyEpisodes?.previousEpisode &&
      pickPriority.length > 0 &&
      !pickPriority.some(m => m.memberId === loggedInMemberId) &&
      !dialogOpen &&
      priorityTimeLeft > 0
    ) {
      return 'wait-for-priority';
    }

    return 'can-pick';
  }, [league, availableCastaways, keyEpisodes, pickPriority, loggedInMemberId, dialogOpen, priorityTimeLeft]);

  const canSubmitMain =
    formSchema.safeParse(form.watch())?.success &&
    !isSubmitting &&
    keyEpisodes?.previousEpisode?.airStatus !== 'Airing';

  const isEpisodeAiring = keyEpisodes?.previousEpisode?.airStatus === 'Airing';

  return {
    league,
    leagueMembers,
    keyEpisodes,
    availableCastaways,
    pickPriority,
    form,
    selected,
    handleSelectionChange,
    handleSubmit,
    isSubmitting,
    canSubmitMain,
    isEpisodeAiring,
    dialogOpen,
    closedDialog,
    setDialogOpen,
    markDialogClosed,
    uiState,
    hoursRemainingForPriority: priorityTimeLeft,
  };
}
