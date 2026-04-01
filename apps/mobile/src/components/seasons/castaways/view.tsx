import { View } from 'react-native';
import { type SeasonsDataQuery } from '~/types/seasons';
import TribeCards from '~/components/seasons/castaways/tribeCards';
import CastawayGrid from '~/components/seasons/castaways/castawayGrid';
import { type SelectionTimelines } from '~/types/leagues';
import { type LeagueMember } from '~/types/leagueMembers';

interface CastawaysViewProps {
  seasonData?: SeasonsDataQuery | null;
  leagueData?: {
    selectionTimeline?: SelectionTimelines;
    leagueMembers?: {
      members: LeagueMember[];
    };
  };
}

export default function CastawaysView({ seasonData, leagueData }: CastawaysViewProps) {
  if (!seasonData) {
    return null;
  }

  const { castaways, tribes, tribesTimeline } = seasonData;

  // Filter out non-season castaways (Jeff Probst, etc.)
  const seasonCastaways = castaways.filter((c) => c.seasonId !== null);

  return (
    <View className='flex-1 gap-4 items-center justify-center'>
      <TribeCards tribes={tribes} />
      <CastawayGrid
        castaways={seasonCastaways}
        tribesTimeline={tribesTimeline}
        tribes={tribes}
        leagueData={leagueData} />
    </View>
  );
}
