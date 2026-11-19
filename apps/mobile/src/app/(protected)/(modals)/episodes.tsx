import { useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Platform, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus } from 'lucide-react-native';
import Button from '~/components/common/button';
import Modal from '~/components/common/modal';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import ManagerHeader from '~/components/sys/managerHeader';
import EpisodeEditor from '~/components/sys/episodes/editor';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';
import { useLeague } from '~/hooks/leagues/query/useLeague';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import { defaultRuntime, useSaveEpisode, type EpisodeDraft } from '~/hooks/seasons/mutation/useSaveEpisode';
import { cn } from '~/lib/utils';

const WEEK = 7 * 24 * 60 * 60 * 1000;

interface Editing {
  /** Missing for a new episode */
  episodeId?: number;
  draft: EpisodeDraft;
}

export default function EpisodesScreen() {
  const { data: userId, isLoading, isError } = useSysAdmin();
  const router = useRouter();

  const { hash } = useLocalSearchParams<{ hash?: string }>();
  const { data: league, isLoading: leagueLoading } = useLeague(hash);

  const { data: seasons } = useSeasons(true);
  const [selectedName, setSelectedName] = useState('');
  // Default to the league's season once it loads, else the newest season
  const defaultSeason = leagueLoading ? undefined
    : seasons?.find((s) => s.seasonId === league?.seasonId)
    ?? [...(seasons ?? [])].sort((a, b) =>
      new Date(b.premiereDate).getTime() - new Date(a.premiereDate).getTime())[0];
  const season = seasons?.find((s) => s.name === selectedName) ?? defaultSeason;
  const seasonId = season?.seasonId ?? null;

  const { data: episodes } = useEpisodes(seasonId);
  const { saveEpisode, isSaving } = useSaveEpisode(season ?? null);
  const [editing, setEditing] = useState<Editing | null>(null);

  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh(
    [['seasons'], ['episodes', seasonId ?? undefined]]
  );

  const header = (
    <ManagerHeader
      title='Episode Manager'
      seasonNames={seasons?.map((s) => s.name) ?? []}
      value={season?.name ?? ''}
      setValue={setSelectedName} />
  );

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background pt-16 justify-center items-center'>
        {header}
        <Text className='text-lg text-center'>Checking Sys Admin Status...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !userId) {
    router.dismiss();
    return null;
  }

  // A week after the last episode, at the same time, or the premiere for an empty season
  const newEpisode = (): EpisodeDraft => {
    const last = episodes?.reduce<typeof episodes[number] | undefined>((latest, episode) =>
      !latest || episode.episodeNumber > latest.episodeNumber ? episode : latest, undefined);
    const episodeNumber = (last?.episodeNumber ?? 0) + 1;
    return {
      episodeNumber,
      title: '',
      airDate: last
        ? new Date(new Date(last.airDate).getTime() + WEEK)
        : new Date(season?.premiereDate ?? Date.now()),
      runtime: defaultRuntime(episodeNumber, false),
      isMerge: false,
      isFinale: false,
    };
  };

  const handleSave = async (draft: EpisodeDraft) => {
    if (await saveEpisode(draft, editing?.episodeId)) setEditing(null);
  };

  return (
    <>
      <SafeAreaRefreshView
        className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
        header={header}
        refreshing={refreshing}
        onRefresh={onRefresh}
        scrollY={scrollY}
        handleScroll={handleScroll}>
        <View className={cn('page justify-start gap-y-2 px-1.5 pb-12', Platform.OS === 'ios' && 'pt-12')}>
          <Button
            className='flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3'
            disabled={!season}
            onPress={() => setEditing({ draft: newEpisode() })}>
            <Plus size={18} color='white' />
            <Text className='text-lg font-semibold text-white'>New Episode</Text>
          </Button>

          {episodes?.length === 0 && (
            <Text className='text-center text-base text-muted-foreground py-4'>
              No episodes yet for {season?.name}.
            </Text>
          )}
          {episodes?.map((episode) => (
            <Button
              key={episode.episodeId}
              className='w-full rounded-xl border-2 border-primary/20 bg-card p-3 gap-1'
              onPress={() => setEditing({
                episodeId: episode.episodeId,
                draft: {
                  episodeNumber: episode.episodeNumber,
                  title: episode.title,
                  airDate: new Date(episode.airDate),
                  runtime: episode.runtime,
                  isMerge: episode.isMerge,
                  isFinale: episode.isFinale,
                },
              })}>
              <Text className='text-lg text-foreground' numberOfLines={1}>
                <Text className='font-bold'>EP {episode.episodeNumber}: </Text>
                {episode.title}
              </Text>
              <View className='flex-row flex-wrap items-center gap-2'>
                <Text className='text-sm text-muted-foreground'>
                  {new Date(episode.airDate).toLocaleString(undefined, {
                    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
                  })}
                  {' · '}{episode.runtime} min
                </Text>
                {episode.isMerge && (
                  <Text className='rounded-full bg-primary/20 px-2 text-xs font-bold text-primary'>MERGE</Text>
                )}
                {episode.isFinale && (
                  <Text className='rounded-full bg-primary/20 px-2 text-xs font-bold text-primary'>FINALE</Text>
                )}
              </View>
            </Button>
          ))}
        </View>
      </SafeAreaRefreshView>

      <Modal visible={!!editing} onClose={() => setEditing(null)}>
        {editing && (
          <EpisodeEditor
            key={editing.episodeId ?? 'new'}
            initial={editing.draft}
            existing={editing.episodeId !== undefined}
            takenNumbers={episodes
              ?.filter((episode) => episode.episodeId !== editing.episodeId)
              .map((episode) => episode.episodeNumber) ?? []}
            isSaving={isSaving}
            onSave={(draft) => void handleSave(draft)} />
        )}
      </Modal>
    </>
  );
}
