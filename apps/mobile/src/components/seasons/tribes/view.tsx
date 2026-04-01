import { useMemo } from 'react';
import { View, Text } from 'react-native';
import { type SeasonsDataQuery } from '~/types/seasons';
import EpisodeMarker from '~/components/seasons/tribes/episodeMarker';
import { type EnrichedCastaway } from '~/types/castaways';

interface TimelineViewProps {
  seasonData?: SeasonsDataQuery | null;
}

export default function TribesTimeline({ seasonData }: TimelineViewProps) {
  const { episodes, castaways, tribes, tribesTimeline, keyEpisodes, baseEvents } = seasonData || {};

  // Get all episode numbers from tribes timeline
  const episodeNumbers = useMemo(() => {
    if (!tribesTimeline) return [];

    return Object.keys(tribesTimeline)
      .map(Number)
      .sort((a, b) => a - b);
  }, [tribesTimeline]);

  // Group castaways by tribe for each episode
  const episodeData = useMemo(() => {
    if (!tribesTimeline || !castaways || !tribes) return [];

    return episodeNumbers.map((episodeNum) => {
      const tribesInEpisode = tribesTimeline[episodeNum] ?? {};
      const castawaysByTribe: Record<number, EnrichedCastaway[]> = {};

      Object.entries(tribesInEpisode).forEach(([tribeIdStr, castawayIds]) => {
        const tribeId = Number(tribeIdStr);
        castawaysByTribe[tribeId] = castawayIds
          .map((id) => castaways.find((c) => c.castawayId === id))
          .filter(Boolean) as EnrichedCastaway[];
      });

      return {
        episodeNumber: episodeNum,
        castawaysByTribe,
        tribes: tribes.filter((t) =>
          Object.keys(tribesInEpisode).includes(t.tribeId.toString())
        ),
      };
    });
  }, [episodeNumbers, tribesTimeline, castaways, tribes]);

  // Determine key episodes
  const getKeyEpisodeLabels = (episodeNum: number): string[] => {
    const labels = [];
    if (episodeNum === 1) labels.push('Premiere');
    if (episodes?.find(e => e.episodeNumber === episodeNum)?.isFinale) labels.push('Finale');
    if (keyEpisodes?.mergeEpisode?.episodeNumber === episodeNum) labels.push('Merge');
    if (Object.values(baseEvents?.[episodeNum] ?? {}).some(e => e.eventName === 'redemption')) labels.push('Redemption');
    return labels;
  };

  return (
    <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20'>
      <View className='rounded-lg bg-card p-4 shadow-lg shadow-primary/10'>
        {/* Header */}
        <View className='mb-4 flex-row items-center gap-2'>
          <View className='h-5 w-0.5 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Tribe Timeline
          </Text>
        </View>

        {/* Description */}
        <Text className='mb-4 font-medium text-muted-foreground'>
          Explore how tribe compositions changed throughout the season. Tap an episode to
          expand and see details.
        </Text>

        {/* Episode List */}
        <View className='gap-2'>
          {episodeData.map(({ episodeNumber, castawaysByTribe, tribes: episodeTribes }) => {
            const episode = episodes?.find((e) => e.episodeNumber === episodeNumber);
            const keyLabels = getKeyEpisodeLabels(episodeNumber);

            return (
              <EpisodeMarker
                key={episodeNumber}
                episodeNumber={episodeNumber}
                episodeTitle={episode?.title}
                tribes={episodeTribes}
                castawaysByTribe={castawaysByTribe}
                isKeyEpisode={keyLabels.length > 0}
                keyEpisodeLabels={keyLabels} />
            );
          })}
        </View>
      </View>
    </View>
  );
}
