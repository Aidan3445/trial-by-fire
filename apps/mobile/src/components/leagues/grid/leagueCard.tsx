import { Link, useRouter } from 'expo-router';
import { FlameKindling, ChevronRight } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { type CurrentSelection, type LeagueMember } from '~/types/leagueMembers';
import { type League } from '~/types/leagues';
import ColorRow from '~/components/shared/colorRow';
import { colors } from '~/lib/colors';
import Button from '~/components/common/button';

interface LeagueCardProps {
  league: League;
  member: LeagueMember;
  currentSelection: CurrentSelection;
  refresh?: boolean;
  width?: number;
}

export default function LeagueCard({
  league,
  member,
  currentSelection,
  width,
}: LeagueCardProps) {
  const router = useRouter();
  return (
    <View className='flex-1 px-2' style={width ? { width } : undefined}>
      <Link href={{ pathname: '/leagues/[hash]', params: { hash: league.hash } }} asChild>
        <Button
          className='flex-1 rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:border-primary/30 active:bg-primary/10'
          onPress={() => {
            router.navigate({ pathname: '/leagues/[hash]', params: { hash: league.hash } });
          }}>
          {/* Header */}
          <View className='flex-row items-start justify-between gap-2'>
            <Text className='flex-1 text-lg font-bold leading-none text-foreground'>
              {league.name}
            </Text>
            <ChevronRight size={20} color={colors.primary} />
          </View>

          {/* Draft Status */}
          <View className='mt-3'>
            {currentSelection ? (
              <View className='flex-row items-center gap-1'>
                <Text className='font-bold text-muted-foreground'>Draft:</Text>
                <Text className='italic text-muted-foreground' numberOfLines={1}>
                  {currentSelection.fullName}
                </Text>
                {currentSelection.isEliminated && (
                  <FlameKindling size={16} color={colors['muted-foreground']} />
                )}
              </View>
            ) : league?.status === 'Draft' ? (
              <Text className='font-bold text-muted-foreground'>Draft in progress</Text>
            ) : (
              <View className='flex-row items-center gap-1'>
                <Text className='font-bold text-muted-foreground'>Draft:</Text>
                <Text className='italic text-muted-foreground'>Yet to draft</Text>
              </View>
            )}
          </View>

          {/* Member Badge */}
          <View className='mt-3'>
            <ColorRow className='justify-center border-2 font-bold' color={member.color}>
              <Text className='font-bold text-black'>{member.displayName}</Text>
            </ColorRow>
          </View>
        </Button>
      </Link>
    </View>
  );
}
