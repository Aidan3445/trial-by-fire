import { useRouter } from 'expo-router';
import { View, Text, Platform } from 'react-native';
import { useSysAdmin } from '~/hooks/user/useSysAdmin';
import { useMemo, useState } from 'react';
import { useSeasonsData } from '~/hooks/seasons/useSeasonsData';
import { useEpisodes } from '~/hooks/seasons/useEpisodes';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cn } from '~/lib/utils';
import SafeAreaRefreshView from '~/components/common/refresh/safeAreaRefreshView';
import { useRefresh } from '~/hooks/helpers/refresh/useRefresh';
import NewLivePredictionHeader from '~/components/livePredictions/new/header/view';
import CreateLivePredictionForm from '~/components/livePredictions/new/createForm';
import EpisodePredictions from '~/components/livePredictions/new/episodePredictions';

export default function NewLivePredictionScreen() {
  const { data: userId, isLoading, isError } = useSysAdmin();
  const router = useRouter();

  const [selectedSeason, setSelectedSeason] = useState<string>('');
  const { data: scoreData } = useSeasonsData(true);

  const selectedSeasonData = useMemo(() => {
    if (!scoreData) return null;
    const selected = scoreData.find(season => season.season.name === selectedSeason);
    if (selected) return selected;
    if (scoreData.length > 0) {
      setSelectedSeason(scoreData[0]!.season.name);
      return scoreData[0];
    }
    return null;
  }, [scoreData, selectedSeason]);

  const seasonId = selectedSeasonData?.season.seasonId ?? null;
  const { data: episodes } = useEpisodes(seasonId);

  // Find currently airing episode
  const currentEpisode = useMemo(
    () => episodes?.find((ep) => ep.airStatus === 'Airing'),
    [episodes]
  );

  const { refreshing, onRefresh, scrollY, handleScroll } = useRefresh(
    [
      ['seasons', undefined, true],
      ['episodes', seasonId ?? undefined],
      ['livePredictions']]
  );

  if (isLoading) {
    return (
      <SafeAreaView className='flex-1 bg-background pt-16 justify-center items-center'>
        <NewLivePredictionHeader
          seasons={scoreData ?? []}
          value={selectedSeason}
          setValue={setSelectedSeason} />
        <Text className='text-lg text-center'>Checking Sys Admin Status...</Text>
      </SafeAreaView>
    );
  }

  if (isError || !userId) {
    router.dismiss();
    return null;
  }

  return (
    <SafeAreaRefreshView
      className={cn('pt-8', refreshing && Platform.OS === 'ios' && 'pt-12')}
      header={
        <NewLivePredictionHeader
          seasons={scoreData ?? []}
          value={selectedSeason}
          setValue={setSelectedSeason} />
      }
      refreshing={refreshing}
      onRefresh={onRefresh}
      scrollY={scrollY}
      handleScroll={handleScroll}>
      <View className={cn(
        'page justify-start gap-y-4 px-1.5 pb-12',
        Platform.OS === 'ios' && 'pt-12'
      )}>
        {/* Create Form */}
        <CreateLivePredictionForm seasonData={selectedSeasonData ?? null} />

        {/* Episode Predictions */}
        {seasonId && episodes && episodes.length > 0 && (
          <EpisodePredictions
            episodes={episodes}
            seasonId={seasonId}
            currentEpisodeId={currentEpisode?.episodeId} />
        )}
      </View>
    </SafeAreaRefreshView>
  );
}
