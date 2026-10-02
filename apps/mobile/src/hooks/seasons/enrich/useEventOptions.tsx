import { useMemo, useCallback } from 'react';
import { Text, View } from 'react-native';
import ColorRow from '~/components/shared/colorRow';
import { useEnrichedTribeMembers } from '~/hooks/seasons/enrich/useEnrichedTribeMembers';
import { useTribes } from '~/hooks/seasons/useTribes';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { type EventReference, type ReferenceType } from '~/types/events';

/**
 * Custom hook to get event options for tribes and castaways.
 * @param {number} seasonId The season ID to get options for.
 * @param {number} selectedEpisode The episode number to get options for.
 * @param {string} eventName The event being created/edited, used to tailor the options.
 * @param {EventReference[]} savedReferences References already saved on the event being edited,
 * these are always included so they remain selectable until the edit is saved.
 */
export function useEventOptions(
  seasonId: number | null,
  selectedEpisode: number | null,
  eventName?: string | null,
  savedReferences?: EventReference[]
) {
  const tribeMembers = useEnrichedTribeMembers(seasonId, selectedEpisode);
  const { data: allTribes } = useTribes(seasonId);
  const { data: allCastaways } = useCastaways(seasonId);

  const tribeMembersArray = useMemo(() => Object.values(tribeMembers ?? {}), [tribeMembers]);

  const tribeOptions = useMemo(() => {
    // tribe updates can move castaways onto empty tribes (e.g. a merge),
    // otherwise only tribes with members at this episode are selectable
    const savedTribeIds = new Set(savedReferences
      ?.filter((ref) => ref.type === 'Tribe')
      .map((ref) => ref.id));
    const activeTribeIds = new Set(tribeMembersArray
      .filter(({ castaways }) => castaways.length > 0)
      .map(({ tribe }) => tribe.tribeId));
    return (allTribes ?? []).filter((tribe) =>
      eventName === 'tribeUpdate' ||
      activeTribeIds.has(tribe.tribeId) ||
      savedTribeIds.has(tribe.tribeId)
    ).map((tribe) => ({
      value: tribe.tribeId,
      label: tribe.tribeName,
      renderLabel: () => (
        <View className='flex-row items-center gap-2'>
          <ColorRow color={tribe.tribeColor} className='w-min px-1 py-0'>
            <Text className='text-base font-medium'>{tribe.tribeName}</Text>
          </ColorRow>
        </View>
      ),
    }));
  }, [allTribes, tribeMembersArray, eventName, savedReferences]);

  const castawayOptions = useMemo(() => {
    const options = tribeMembersArray.flatMap(({ tribe, castaways }) =>
      castaways.map(castaway => ({
        value: castaway.castawayId,
        label: castaway.fullName,
        renderLabel: () => (
          <View className='flex-row items-center gap-2'>
            <ColorRow color={tribe.tribeColor} className='w-min px-1 py-0'>
              <Text className='text-base font-medium'>{tribe.tribeName}</Text>
            </ColorRow>
            <Text className='text-base font-medium'>{castaway.fullName}</Text>
          </View>
        )
      }))
    );
    // Jeff (and any other production castaways) have no season
    if (eventName === 'spokeEpTitle') {
      (allCastaways ?? [])
        .filter((castaway) => castaway.seasonId === null)
        .forEach((castaway) => options.push({
          value: castaway.castawayId,
          label: castaway.fullName,
          renderLabel: () => (
            <Text className='text-base font-medium'>{castaway.fullName}</Text>
          )
        }));
    }
    // keep saved castaways selectable even if they are no longer active
    savedReferences
      ?.filter((ref) => ref.type === 'Castaway' && !options.some((o) => o.value === ref.id))
      .forEach((ref) => {
        const castaway = allCastaways?.find((c) => c.castawayId === ref.id);
        if (!castaway) return;
        options.push({
          value: castaway.castawayId,
          label: castaway.fullName,
          renderLabel: () => (
            <Text className='text-base font-medium'>{castaway.fullName}</Text>
          )
        });
      });
    return options;
  }, [tribeMembersArray, allCastaways, eventName, savedReferences]);

  const combinedReferenceOptions = useMemo(() => [
    { label: 'Tribes', value: null },
    ...tribeOptions.map(tribe => ({
      label: tribe.label,
      value: `Tribe_${tribe.value}`,
      renderLabel: tribe.renderLabel
    })),
    { label: 'Castaways', value: null },
    ...castawayOptions.map(castaway => ({
      label: castaway.label,
      value: `Castaway_${castaway.value}`,
      renderLabel: castaway.renderLabel
    }))
  ],
    [tribeOptions, castawayOptions]
  );

  const handleCombinedReferenceSelection = useCallback((values: (string | number)[]) => {
    return values.map(value => {
      const [type, id] = String(value).split('_');
      return { type: type as ReferenceType, id: Number(id) };
    });
  }, []);

  const getDefaultStringValues = useCallback(
    (references: { type: ReferenceType; id: number }[]) => {
      return references.map(ref => `${ref.type}_${ref.id}`);
    }, []);

  return {
    tribeOptions,
    castawayOptions,
    combinedReferenceOptions,
    handleCombinedReferenceSelection,
    getDefaultStringValues
  };
}
