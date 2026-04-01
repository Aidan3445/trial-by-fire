import { useMemo, useCallback } from 'react';
import { useEnrichedTribeMembers } from '~/hooks/seasons/enrich/useEnrichedTribeMembers';
import { useTribes } from '~/hooks/seasons/useTribes';
import { type ReferenceType } from '~/types/events';

/**
  * Custom hook to get event options for tribes and castaways.
  * @param {number} seasonId The season ID to get options for.
  * @param {number} selectedEpisode The episode number to get options for.
  */
export function useEventOptions(seasonId: number | null, selectedEpisode: number | null) {
  const tribeMembers = useEnrichedTribeMembers(seasonId, selectedEpisode);
  const { data: allTribes } = useTribes(seasonId);

  const tribeMembersArray = useMemo(() =>
    Object.values(tribeMembers ?? {}),
    [tribeMembers]
  );

  const tribeOptions = useMemo(() => {
    const options = (allTribes ?? []).map(tribe => ({
      value: tribe.tribeId,
      label: tribe.tribeName,
      color: tribe.tribeColor,
    }));
    console.log('tribeOptions (all season tribes):', options);
    return options;
  }, [allTribes]);

  const castawayOptions = useMemo(() =>
    tribeMembersArray.flatMap(({ castaways }) =>
      castaways.map(castaway => ({
        value: castaway.castawayId,
        label: castaway.fullName,
      }))
    ),
    [tribeMembersArray]
  );

  const combinedReferenceOptions = useMemo(() => {
    const options = [
      { label: 'Tribes', value: null },
      ...tribeOptions.map(tribe => ({
        label: tribe.label,
        value: `Tribe_${tribe.value}`,
        color: tribe.color,
      })),
      { label: 'Castaways', value: null },
      ...castawayOptions.map(castaway => ({
        label: castaway.label,
        value: `Castaway_${castaway.value}`,
      })),
    ];
    console.log('combinedReferenceOptions:', options);
    return options;
  }, [tribeOptions, castawayOptions]);

  const handleCombinedReferenceSelection = useCallback((values: (string | number)[]) => {
    return values.map(value => {
      const [type, id] = String(value).split('_');
      return {
        type: type as ReferenceType,
        id: Number(id),
      };
    });
  }, []);

  const getDefaultStringValues = useCallback((references: { type: ReferenceType; id: number }[]) => {
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
