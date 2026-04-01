import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Alert, Text, View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useLeagueActionDetails } from '~/hooks/leagues/enrich/useActionDetails';
import { useEliminations } from '~/hooks/seasons/useEliminations';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type LeagueMember } from '~/types/leagueMembers';
import { MAX_SEASON_LENGTH } from '~/lib/leagues';
import ColorRow from '~/components/shared/colorRow';
import { cn } from '~/lib/utils';
import * as StoreReview from 'expo-store-review';

const formSchema = z.object({
  castawayId: z.coerce.number({ required_error: 'Please select a castaway' }),
  secondaryCastawayId: z.coerce.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function useChangeCastaway() {
  const queryClient = useQueryClient();
  const postCastaway = useFetch('POST');

  const {
    league,
    rules,
    actionDetails,
    keyEpisodes,
    leagueMembers,
    membersWithPicks,
    selectionTimeline,
  } = useLeagueActionDetails();

  const { data: eliminations } = useEliminations(league?.seasonId ?? null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const [selected, setSelected] = useState('');
  const [secondarySelected, setSecondarySelected] = useState<string | undefined>(undefined);
  const [initialSecondaryPick, setInitialSecondaryPick] = useState<string | undefined>(undefined);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [closedDialog, setClosedDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittingSecondary, setIsSubmittingSecondary] = useState(false);

  const secondaryPickSettings = rules?.secondaryPick;

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

  const castawayLockoutStatus = useMemo(() => {
    if (
      !secondaryPickSettings?.enabled ||
      !leagueMembers?.loggedIn ||
      !selectionTimeline?.secondaryPicks ||
      !keyEpisodes?.previousEpisode
    ) {
      return new Map<number, { isLockedOut: boolean; episodePicked?: number; episodesRemaining?: number }>();
    }

    const memberId = leagueMembers.loggedIn.memberId;
    const lockoutPeriod = secondaryPickSettings.lockoutPeriod;
    const previousEpisode = keyEpisodes.previousEpisode.episodeNumber;
    const secondaryPicks = selectionTimeline.secondaryPicks[memberId] ?? [];

    const lockoutMap = new Map<number, { isLockedOut: boolean; episodePicked?: number; episodesRemaining?: number }>();

    secondaryPicks.forEach((castawayId, episodeIndex) => {
      if (castawayId !== null && castawayId !== undefined) {
        const episodeNumber = episodeIndex;
        const episodesSinceLastPick = previousEpisode - episodeNumber;

        if (
          (lockoutPeriod === 0 || episodesSinceLastPick < lockoutPeriod) &&
          episodeNumber <= previousEpisode
        ) {
          if (
            !lockoutMap.has(castawayId) ||
            (lockoutMap.get(castawayId)?.episodePicked ?? 0) < episodeNumber
          ) {
            lockoutMap.set(castawayId, {
              isLockedOut: true,
              episodePicked: episodeNumber,
              episodesRemaining:
                lockoutPeriod === MAX_SEASON_LENGTH
                  ? undefined
                  : Math.max(0, lockoutPeriod - episodesSinceLastPick),
            });
          }
        }
      }
    });

    return lockoutMap;
  }, [secondaryPickSettings, leagueMembers, selectionTimeline, keyEpisodes]);

  // Secondary init — search all picks regardless of out status
  useEffect(() => {
    if (!secondaryPickSettings?.enabled || !leagueMembers?.loggedIn || !membersWithPicks.length) return;

    const memberId = leagueMembers.loggedIn.memberId;
    const memberPick = membersWithPicks.find(mwp => mwp.member.memberId === memberId);

    if (memberPick?.secondary) {
      const secondaryId = `${memberPick.secondary.castawayId}`;
      setSecondarySelected(secondaryId);
      setInitialSecondaryPick(secondaryId);
      form.setValue('secondaryCastawayId', memberPick.secondary.castawayId);
    } else {
      setSecondarySelected(undefined);
      setInitialSecondaryPick(undefined);
      form.setValue('secondaryCastawayId', undefined);
    }
  }, [secondaryPickSettings, membersWithPicks, leagueMembers, form]);

  const handleSelectionChange = (field: 'survivor' | 'secondary', value: string) => {
    if (field === 'survivor') {
      setSelected(value);
      form.setValue('castawayId', parseInt(value));
      if (value === secondarySelected) {
        setSecondarySelected(undefined);
        form.setValue('secondaryCastawayId', undefined);
      }
    } else {
      setSecondarySelected(value);
      form.setValue('secondaryCastawayId', parseInt(value));
      if (value === selected) {
        setSelected('');
        form.resetField('castawayId');
      }
    }
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

  const handleSecondarySubmit = async () => {
    if (!league || !keyEpisodes?.nextEpisode || !secondarySelected) return { success: false };

    setIsSubmittingSecondary(true);
    try {
      const response = await postCastaway(`/api/leagues/${league.hash}/secondary/pick`, {
        body: { castawayId: parseInt(secondarySelected) },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message ?? 'Failed to choose secondary pick');
      }

      await queryClient.invalidateQueries({ queryKey: ['selectionTimeline', league.hash] });
      setInitialSecondaryPick(secondarySelected);
      Alert.alert('Success', 'Secondary pick chosen successfully');
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to choose secondary pick';
      Alert.alert('Error', errorMessage);
      return { success: false };
    } finally {
      setIsSubmittingSecondary(false);
    }
  };

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

    if (availableCastaways.every((c) => c.pickedBy)) return 'no-castaways';

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

  const canSubmitSecondary =
    !!secondarySelected &&
    secondarySelected !== initialSecondaryPick &&
    !isSubmittingSecondary &&
    keyEpisodes?.previousEpisode?.airStatus !== 'Airing';

  const isEpisodeAiring = keyEpisodes?.previousEpisode?.airStatus === 'Airing';

  // Matches web: include redemption-alive castaways
  const secondaryCastawayOptions = availableCastaways
    .filter((castaway) =>
      !castaway.eliminatedEpisode ||
      castaway.redemption?.some((r) => r.secondEliminationEpisode === null)
    )
    .map((castaway) => {
      const lockoutInfo = castawayLockoutStatus.get(castaway.castawayId);
      const isLockedOut = lockoutInfo?.isLockedOut ?? false;
      const isOwnSurvivor =
        !secondaryPickSettings?.canPickOwnSurvivor &&
        castaway.pickedBy?.memberId === leagueMembers?.loggedIn?.memberId;

      const isDisabled = isOwnSurvivor || isLockedOut;

      let disabledText = castaway.fullName;
      if (isOwnSurvivor) {
        disabledText += ' (Your Survivor)';
      } else if (isLockedOut && lockoutInfo) {
        const { episodePicked, episodesRemaining } = lockoutInfo;
        if (episodesRemaining !== undefined && episodesRemaining > 0) {
          disabledText += ` (unavailable for ${episodesRemaining} more ${episodesRemaining === 1 ? 'episode' : 'episodes'})`;
        } else {
          disabledText += ` (Picked Ep ${episodePicked})`;
        }
      }

      return {
        value: castaway.castawayId,
        label: isDisabled ? disabledText : castaway.fullName,
        disabled: isDisabled,
        renderLabel: () => (
          <View className={cn('flex-1 flex-row items-center gap-2', isDisabled && 'opacity-50')}>
            {castaway.tribe && (
              <ColorRow className='w-min' color={castaway.tribe.color}>
                <Text className='text-base font-medium'>
                  {castaway.tribe.name}
                </Text>
              </ColorRow>
            )}
            <Text className='text-base text-foreground w-5/6'>
              {isDisabled ? disabledText : castaway.fullName}
            </Text>
          </View>
        ),
      };
    });

  return {
    league,
    leagueMembers,
    keyEpisodes,
    secondaryPickSettings,
    availableCastaways,
    secondaryCastawayOptions,
    pickPriority,
    castawayLockoutStatus,
    form,
    selected,
    secondarySelected,
    initialSecondaryPick,
    handleSelectionChange,
    handleSubmit,
    handleSecondarySubmit,
    isSubmitting,
    isSubmittingSecondary,
    canSubmitMain,
    canSubmitSecondary,
    isEpisodeAiring,
    dialogOpen,
    closedDialog,
    setDialogOpen,
    markDialogClosed,
    uiState,
    hoursRemainingForPriority: priorityTimeLeft,
  };
}
