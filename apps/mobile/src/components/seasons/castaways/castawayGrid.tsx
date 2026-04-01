import { View, Text } from 'react-native';
import { useMemo, useState } from 'react';
import { ArrowDownAZ, TreePalm } from 'lucide-react-native';

import { type EnrichedCastaway } from '~/types/castaways';
import { type Tribe, type TribesTimeline } from '~/types/tribes';
import CastawayCard from '~/components/seasons/castaways/castawayCard';
import { type SelectionTimelines } from '~/types/leagues';
import { type LeagueMember } from '~/types/leagueMembers';
import Button from '~/components/common/button';

interface CastawayGridProps {
  castaways: EnrichedCastaway[];
  tribesTimeline: TribesTimeline;
  tribes: Tribe[];
  leagueData?: {
    selectionTimeline?: SelectionTimelines;
    leagueMembers?: {
      members: LeagueMember[];
    };
  };
}

type SortMode = 'alpha' | 'tribe';

export default function CastawayGrid({
  castaways,
  tribesTimeline,
  tribes,
  leagueData,
}: CastawayGridProps) {
  const { selectionTimeline, leagueMembers } = leagueData ?? {};
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  const tribeOrder = useMemo(
    () => new Map(tribes.map((t, i) => [t.tribeName, i])),
    [tribes]
  );

  const sortedCastaways = useMemo(() => {
    if (sortMode === 'alpha') {
      return castaways;
    }

    return [...castaways].sort((a, b) => {
      const aTribe = a.tribe?.name ?? 'Unassigned';
      const bTribe = b.tribe?.name ?? 'Unassigned';

      const aIndex = tribeOrder.get(aTribe) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = tribeOrder.get(bTribe) ?? Number.MAX_SAFE_INTEGER;

      return aIndex - bIndex;
    });
  }, [castaways, sortMode, tribeOrder]);

  return (
    <View className='relative w-full overflow-hidden rounded-xl bg-card border-2 border-primary/20 px-4 pt-4 pb-3'>
      {/* Header */}
      <View className='mb-4 flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <View className='h-5 w-0.5 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            All Castaways
          </Text>
        </View>

        <Button
          onPress={() =>
            setSortMode((m) => (m === 'alpha' ? 'tribe' : 'alpha'))
          }
          className='rounded-md bg-accent p-1 border-2 border-primary/20'>
          {sortMode === 'alpha' ? (
            <ArrowDownAZ size={18} className='text-muted-foreground' />
          ) : (
            <TreePalm size={18} className='text-muted-foreground' />
          )}
        </Button>
      </View>

      {/* Grid */}
      <View className='flex-col gap-1'>
        {sortedCastaways.map((castaway) => (
          <View key={castaway.castawayId}>
            <CastawayCard
              castaway={castaway}
              tribesTimeline={tribesTimeline}
              tribes={tribes}
              member={leagueMembers?.members.find(
                (m) =>
                  selectionTimeline?.castawayMembers[castaway.castawayId]
                    ?.slice()
                    ?.pop() === m.memberId
              )} />
          </View>
        ))}
      </View>
    </View>
  );
}
