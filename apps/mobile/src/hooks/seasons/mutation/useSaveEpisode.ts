import { useState } from 'react';
import { Alert } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { type Season } from '~/types/seasons';

export interface EpisodeDraft {
  episodeNumber: number;
  title: string;
  airDate: Date;
  runtime: number;
  isMerge: boolean;
  isFinale: boolean;
}

/** Premieres and finales run long */
export function defaultRuntime(episodeNumber: number, isFinale: boolean) {
  return isFinale ? 180 : episodeNumber === 1 ? 120 : 90;
}

/**
 * Create or update a season's episodes (sys admin only)
 * @param season The season the episodes belong to
 */
export function useSaveEpisode(season: Pick<Season, 'seasonId' | 'name'> | null) {
  const queryClient = useQueryClient();
  const postEpisodes = useFetch('POST');
  const putEpisode = useFetch('PUT');
  const [isSaving, setIsSaving] = useState(false);

  /**
   * @param draft The episode's details
   * @param episodeId The episode to update; leave out to create a new one
   * @returns whether it saved
   */
  const saveEpisode = async (draft: EpisodeDraft, episodeId?: number) => {
    if (!season) return false;
    setIsSaving(true);
    try {
      const res = episodeId
        ? await putEpisode('/api/seasons/episodes', { body: { episodeId, ...draft } })
        : await postEpisodes('/api/seasons/episodes', {
          body: { seasonName: season.name, episodes: [draft] },
        });
      if (!res.ok) throw new Error(`Failed to save episode: ${res.status}`);

      // Episodes, and the season dates and data built from them
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['episodes', season.seasonId] }),
        queryClient.invalidateQueries({ queryKey: ['seasons'] }),
      ]);
      return true;
    } catch (e) {
      console.error('Failed to save episode', e);
      Alert.alert('Error', `Failed to ${episodeId ? 'update' : 'create'} episode`);
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return { saveEpisode, isSaving };
}
