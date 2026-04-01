import { useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { PredictionWithEvent, EventReference } from '~/types/events';
import PredictionRow from '~/components/leagues/hub/activity/predictionHistory/row';
import { useCastaways } from '~/hooks/seasons/useCastaways';
import { useTribes } from '~/hooks/seasons/useTribes';
import { colors } from '~/lib/colors';
import { PointsIcon } from '~/components/icons/generated';

interface PredictionTableProps {
  predictions: PredictionWithEvent[];
  previousEpisodeNumber: number;
  seasonId: number;
  noCarousel?: boolean;
}

export default function PredictionTable({
  predictions,
  previousEpisodeNumber,
  seasonId,
  noCarousel = false,
}: PredictionTableProps) {
  const { data: castaways } = useCastaways(seasonId);
  const { data: tribes } = useTribes(seasonId);

  const hasBets = useMemo(
    () => predictions.some((pred) => pred.bet && pred.bet > 0),
    [predictions]
  );

  const findReferenceNames = useCallback(
    (references?: EventReference[]) => {
      if (!castaways || !tribes || !references) return [{ short: 'TBD', full: 'TBD' }];

      const refs = references
        .map((ref) => {
          if (ref.type === 'Castaway') {
            const castaway = castaways.find((c) => c.castawayId === ref.id);
            return castaway ? { short: castaway.shortName, full: castaway.fullName } : null;
          } else if (ref.type === 'Tribe') {
            const tribe = tribes.find((t) => t.tribeId === ref.id);
            return tribe ? { short: tribe.tribeName, full: tribe.tribeName } : null;
          }
          return null;
        })
        .filter(Boolean) as { short: string; full: string }[];

      return refs.length > 0 ? refs : [{ short: 'TBD', full: 'TBD' }];
    },
    [castaways, tribes]
  );

  const sortedPredictions = useMemo(
    () => [...predictions].sort((a) => (a.timing.some((t) => t.startsWith('Weekly')) ? 1 : -1)),
    [predictions]
  );

  return (
    <View>
      {/* Header */}
      <View className='flex-row bg-accent border-b-2 border-primary/20 px-2 py-2 gap-1'>
        <Text className='flex-1 text-sm font-bold uppercase tracking-wider text-muted-foreground text-left'>
          Event
        </Text>
        <View className='items-center w-12 text-sm font-bold uppercase tracking-wider text-muted-foreground text-center'>
          <PointsIcon size={14} color={colors['muted-foreground']} />
        </View>
        {hasBets && (
          <Text className='w-12 text-sm font-bold uppercase tracking-wider text-muted-foreground text-center'>
            Bet
          </Text>
        )}
        <Text className='w-20 text-sm font-bold uppercase tracking-wider text-muted-foreground text-left'>
          Pick
        </Text>
        <Text className='w-20 text-sm font-bold uppercase tracking-wider text-muted-foreground text-left'>
          Result
        </Text>
      </View>

      {/* Rows */}
      <ScrollView className='max-h-40'>
        {sortedPredictions.map((pred, index) => (
          <PredictionRow
            key={index}
            prediction={pred}
            hasBets={hasBets}
            findReferenceNames={findReferenceNames}
            previousEpisodeNumber={previousEpisodeNumber} />
        ))}
        {!noCarousel && sortedPredictions.length > 3 && (
          <View className='h-5' />
        )}
      </ScrollView>
    </View>
  );
}
