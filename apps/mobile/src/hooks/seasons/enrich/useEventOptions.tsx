import { useMemo, useCallback } from 'react';
import { Text, View } from 'react-native';
import ColorRow from '~/components/shared/colorRow';
import { useEnrichedTribeMembers } from '~/hooks/seasons/enrich/useEnrichedTribeMembers';
import { type ReferenceType } from '~/types/events';

/**
 * Custom hook to get event options for tribes and castaways.
 * @param {number} seasonId The season ID to get options for.
 * @param {number} selectedEpisode The episode number to get options for.
 */
export function useEventOptions(seasonId: number | null, selectedEpisode: number | null) {
  const tribeMembers = useEnrichedTribeMembers(seasonId, selectedEpisode);

  const tribeMembersArray = useMemo(() => Object.values(tribeMembers ?? {}), [tribeMembers]);

  const tribeOptions = useMemo(() =>
    tribeMembersArray.map(({ tribe }) => ({
      value: tribe.tribeId,
      label: tribe.tribeName,
      renderLabel: () => (
        <View className='flex-row items-center gap-2'>
          <ColorRow color={tribe.tribeColor} className='w-min px-1 py-0'>
            <Text className='text-base font-medium'>{tribe.tribeName}</Text>
          </ColorRow>
        </View>
      ),
    })),
    [tribeMembersArray]
  );

  const castawayOptions = useMemo(() =>
    tribeMembersArray.flatMap(({ tribe, castaways }) =>
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
    ),
    [tribeMembersArray]
  );

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
