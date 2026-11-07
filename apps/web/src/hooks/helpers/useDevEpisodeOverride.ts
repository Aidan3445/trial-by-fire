import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useDevHarness, useUpdateDevHarness } from '~/hooks/helpers/useDevHarness';
import { type Episode, type EpisodeOverrideConfig } from '~/types/episodes';

const formSchema = z.object({
  seasonId: z.number(),
  previousEpisodeId: z.number().nullable(),
  nextEpisodeId: z.number().nullable(),
  mergeEpisodeId: z.number().nullable(),
  previousAirStatus: z.enum(['Aired', 'Airing']),
  leagueStatus: z.enum(['Predraft', 'Draft', 'Active', 'Inactive']),
  startWeek: z.number(),
});

type FormValues = z.infer<typeof formSchema>;

const DEFAULT_VALUES: FormValues = {
  seasonId: 0,
  previousEpisodeId: null,
  nextEpisodeId: null,
  mergeEpisodeId: null,
  previousAirStatus: 'Aired',
  leagueStatus: 'Active',
  startWeek: 1,
};

/**
  * Dev harness override panel state. The override is stored on the dev server, which
  * applies it to its own API responses; this only reads and writes that stored state.
  */
export function useDevEpisodeOverride() {
  const [open, setOpen] = useState(false);
  const [selectedSeasonId, setSelectedSeasonIdState] = useState<number | null>(null);
  // Only auto-fill the merge episode when the season is picked by hand, not when loading a stored config
  const autoFillMerge = useRef(false);

  const { data: harness } = useDevHarness();
  const updateHarness = useUpdateDevHarness();
  const config = harness?.config ?? null;
  const overrideEnabled = !!config?.enabled;
  const broadcastEnabled = !!harness?.broadcast;

  const { data: seasons } = useSeasons(true);
  // Real episodes (raw=true skips the harness) so the override is configured against real data
  const { data: episodes, isLoading: episodesLoading } = useQuery<Episode[]>({
    queryKey: ['devHarnessEpisodes', selectedSeasonId],
    queryFn: async () => {
      const res = await fetch(`/api/seasons/episodes?seasonId=${selectedSeasonId}&raw=true`);
      if (!res.ok) throw new Error('Failed to fetch episode data');
      const { episodes } = await res.json() as { episodes: Episode[] };
      return episodes.map(ep => ({ ...ep, airDate: new Date(ep.airDate) }));
    },
    enabled: !!selectedSeasonId,
  });

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: DEFAULT_VALUES,
  });

  const watchPrevious = form.watch('previousEpisodeId');
  const watchNext = form.watch('nextEpisodeId');

  const setSelectedSeasonId = (seasonId: number | null) => {
    autoFillMerge.current = true;
    setSelectedSeasonIdState(seasonId);
  };

  // Load the stored override into the form whenever the dialog opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && config) {
      autoFillMerge.current = false;
      setSelectedSeasonIdState(config.seasonId);
      form.reset({
        seasonId: config.seasonId,
        previousEpisodeId: config.previousEpisodeId,
        nextEpisodeId: config.nextEpisodeId,
        mergeEpisodeId: config.mergeEpisodeId,
        previousAirStatus: config.previousAirStatus,
        leagueStatus: config.leagueStatus,
        startWeek: config.startWeek,
      });
    }
    setOpen(isOpen);
  };

  // When the season is picked, auto-populate its real merge episode
  useEffect(() => {
    if (!autoFillMerge.current || !episodes || episodes.length === 0) return;
    autoFillMerge.current = false;
    form.setValue('mergeEpisodeId', episodes.find(ep => ep.isMerge)?.episodeId ?? null);
  }, [selectedSeasonId, episodes, form]);

  // When previous changes, auto-set next
  useEffect(() => {
    if (!episodes || episodes.length === 0 || watchPrevious === undefined) return;

    if (watchPrevious === null) {
      // Previous is null: Set next to episode 1
      const firstEp = episodes.find(ep => ep.episodeNumber === 1);
      if (firstEp) {
        form.setValue('nextEpisodeId', firstEp.episodeId);
      }
      // Merge to real merge or null (handled by season change effect)
    } else {
      const prevEp = episodes.find(ep => ep.episodeId === watchPrevious);
      if (!prevEp) return;

      // Check if previous is last episode
      const isLast = !episodes.some(ep => ep.episodeNumber > prevEp.episodeNumber);
      if (isLast) {
        form.setValue('nextEpisodeId', null);
      } else {
        // Set next to previous + 1
        const nextEp = episodes.find(ep => ep.episodeNumber === prevEp.episodeNumber + 1);
        if (nextEp) {
          form.setValue('nextEpisodeId', nextEp.episodeId);
        }
      }
    }
  }, [watchPrevious, episodes, form]);

  // When next changes, auto-set previous
  useEffect(() => {
    if (!episodes || episodes.length === 0 || watchNext === undefined) return;

    if (watchNext === null) {
      // Next is null: Clear all
      form.setValue('previousEpisodeId', null);
      form.setValue('mergeEpisodeId', null);
    } else {
      const nextEp = episodes.find(ep => ep.episodeId === watchNext);
      if (!nextEp) return;

      // Check if next is first episode
      if (nextEp.episodeNumber === 1) {
        form.setValue('previousEpisodeId', null);
      } else {
        // Set previous to next - 1
        const prevEp = episodes.find(ep => ep.episodeNumber === nextEp.episodeNumber - 1);
        if (prevEp) {
          form.setValue('previousEpisodeId', prevEp.episodeId);
        }
      }
    }
  }, [watchNext, episodes, form]);

  const handleApply = form.handleSubmit(async (data) => {
    const newConfig: EpisodeOverrideConfig = { ...data, enabled: true };
    await updateHarness({ config: newConfig });
    setOpen(false);
  });

  const handleReset = async () => {
    await updateHarness({ config: null });
    form.reset(DEFAULT_VALUES);
    setSelectedSeasonIdState(null);
  };

  const handleToggle = async (enabled: boolean) => {
    if (!config) return;
    await updateHarness({ config: { ...config, enabled } });
  };

  const handleBroadcastToggle = async (broadcast: boolean) => {
    await updateHarness({ broadcast });
  };

  return {
    open,
    setOpen: handleOpenChange,
    overrideEnabled,
    handleToggle,
    broadcastEnabled,
    handleBroadcastToggle,
    seasons,
    episodes,
    episodesLoading,
    selectedSeasonId,
    setSelectedSeasonId,
    form,
    handleApply,
    handleReset,
    watchPrevious,
  };
}
