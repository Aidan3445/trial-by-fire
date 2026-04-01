import { useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import Button from '~/components/common/button';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { useFetch } from '~/hooks/helpers/useFetch';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { type LivePredictionWithOptions } from '~/types/events';
import { type Episode } from '~/types/episodes';
import LivePredictionCard from '~/components/livePredictions/new/predictionCard';

interface EpisodePredictionsProps {
  episodes: Episode[];
  seasonId: number;
  /** Highlight this episode as "current" */
  currentEpisodeId?: number;
}

export default function EpisodePredictions({
  episodes,
  seasonId,
  currentEpisodeId,
}: EpisodePredictionsProps) {
  // Show current episode expanded, others collapsed
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(
    new Set(currentEpisodeId ? [currentEpisodeId] : [])
  );

  const toggleEpisode = (episodeId: number) => {
    setExpandedEpisodes((prev) => {
      const next = new Set(prev);
      if (next.has(episodeId)) {
        next.delete(episodeId);
      } else {
        next.add(episodeId);
      }
      return next;
    });
  };

  // Reverse order — most recent first
  const sortedEpisodes = useMemo(() => [...episodes].reverse(),
    [episodes]
  );

  return (
    <View className='gap-2 w-full bg-card rounded-xl border-2 border-primary/20 p-3'>
      <View className='flex-row items-center gap-2 px-1'>
        <View className='h-6 w-1 rounded-full bg-primary' />
        <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
          Predictions by Episode
        </Text>
      </View>

      {sortedEpisodes.map((ep) => (
        <EpisodeSection
          key={ep.episodeId}
          episode={ep}
          seasonId={seasonId}
          isExpanded={expandedEpisodes.has(ep.episodeId)}
          isCurrent={ep.episodeId === currentEpisodeId}
          onToggle={() => toggleEpisode(ep.episodeId)} />
      ))}
    </View>
  );
}

interface EpisodeSectionProps {
  episode: Episode;
  seasonId: number;
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
}

function EpisodeSection({ episode, isExpanded, isCurrent, onToggle }: EpisodeSectionProps) {
  const getData = useFetch();

  const { data: predictions } = useQuery<LivePredictionWithOptions[]>({
    queryKey: ['livePredictions', episode.episodeId],
    queryFn: async () => {
      const res = await getData(`/api/live?episodeId=${episode.episodeId}`);
      if (!res.ok) throw new Error('Failed to fetch');
      return res.json();
    },
    enabled: isExpanded,
  });

  const predictionCount = predictions?.length ?? 0;

  return (
    <View className={cn(
      'rounded-xl border-2 bg-accent overflow-hidden',
      isCurrent ? 'border-primary/30' : 'border-primary/10'
    )}>
      {/* Episode header */}
      <Button
        onPress={onToggle}
        className='flex-row items-center justify-between p-3 active:opacity-80'>
        <View className='flex-row items-center gap-2 flex-1'>
          <Text className={cn(
            'text-base font-bold',
            isCurrent ? 'text-primary' : 'text-foreground'
          )}>
            EP {episode.episodeNumber}
          </Text>
          <Text className='text-sm text-muted-foreground flex-1' numberOfLines={1}>
            {episode.title}
          </Text>
          {isCurrent && (
            <View className='rounded-full bg-primary/15 px-2 py-0.5'>
              <Text className='text-sm font-bold text-primary'>LIVE</Text>
            </View>
          )}
        </View>
        <View className='flex-row items-center gap-2'>
          {isExpanded && predictionCount > 0 && (
            <Text className='text-sm text-muted-foreground'>
              {predictionCount}
            </Text>
          )}
          {isExpanded
            ? <ChevronUp size={18} color={colors.mutedForeground} />
            : <ChevronDown size={18} color={colors.mutedForeground} />}
        </View>
      </Button>

      {/* Predictions list */}
      {isExpanded && (
        <View className='px-2 pb-2 gap-2'>
          {!predictions && (
            <Text className='text-sm text-muted-foreground text-center py-2'>Loading...</Text>
          )}
          {predictions && predictions.length === 0 && (
            <Text className='text-sm text-muted-foreground text-center py-2'>
              No predictions for this episode
            </Text>
          )}
          {predictions?.map((pred) => (
            <LivePredictionCard key={pred.livePredictionId} prediction={pred} />
          ))}
        </View>
      )}
    </View>
  );
}
