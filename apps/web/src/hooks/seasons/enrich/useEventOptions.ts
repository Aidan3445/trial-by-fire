import { useMemo, useCallback } from 'react';
import { useEnrichedTribeMembers } from '~/hooks/seasons/enrich/useEnrichedTribeMembers';
import { useTribes } from '~/hooks/seasons/useTribes';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { type ReferenceType } from '~/types/events';

/**
  * Custom hook to get event options for tribes and castaways.
  * @param {number} seasonId The season ID to get options for.
  * @param {number} selectedEpisode The episode number to get options for.
  * @param {string} eventName The event being created/edited, used to tailor the options.
  */
export function useEventOptions(
  seasonId: number | null,
  selectedEpisode: number | null,
  eventName?: string | null
) {
  const tribeMembers = useEnrichedTribeMembers(seasonId, selectedEpisode);
  const { data: allTribes } = useTribes(seasonId);
  const { data: allCastaways } = useCastaways(seasonId);

  const tribeMembersArray = useMemo(() =>
    Object.values(tribeMembers ?? {}),
    [tribeMembers]
  );

  const tribeOptions = useMemo(() => {
    // tribe updates can move castaways onto empty tribes (e.g. a merge),
    // otherwise only tribes with members at this episode are selectable
    const tribes = eventName === 'tribeUpdate'
      ? (allTribes ?? [])
      : tribeMembersArray
        .filter(({ castaways }) => castaways.length > 0)
        .map(({ tribe }) => tribe);
    return tribes.map(tribe => ({
      value: tribe.tribeId,
      label: tribe.tribeName,
      color: tribe.tribeColor,
    }));
  }, [allTribes, tribeMembersArray, eventName]);

  const castawayOptions = useMemo(() => {
    const options = tribeMembersArray.flatMap(({ castaways }) =>
      castaways.map(castaway => ({
        value: castaway.castawayId,
        label: castaway.fullName,
      }))
    );
    // Jeff (and any other production castaways) have no season
    if (eventName === 'spokeEpTitle') {
      (allCastaways ?? [])
        .filter(castaway => castaway.seasonId === null)
        .forEach(castaway => options.push({
          value: castaway.castawayId,
          label: castaway.fullName,
        }));
    }
    return options;
  }, [tribeMembersArray, allCastaways, eventName]);

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
