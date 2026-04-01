import { View, Text, Pressable, Switch, ScrollView } from 'react-native';
import { useMemo } from 'react';
import { Users } from 'lucide-react-native';
import ColorRow from '~/components/shared/colorRow';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { colors } from '~/lib/colors';
import { type LeagueMember } from '~/types/leagueMembers';

interface ChooseMembersProps {
  sortedMemberScores: { member: LeagueMember }[] | undefined;
  selectedMembers: Set<number>;
  toggleMember: (_memberId: number, _isLoggedIn: boolean) => void;
}

export default function ChooseMembers({
  sortedMemberScores,
  selectedMembers,
  toggleMember,
}: ChooseMembersProps) {
  const { data: seasons } = useSeasons(true);

  const currentSeason = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    return seasons[0];
  }, [seasons]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View className='items-center justify-center py-2'>
        {/* Title Section */}
        <View className='mb-6 items-center'>
          <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
            <Users size={24} color={colors.primary} />
          </View>
          <Text className='text-center text-2xl font-black tracking-wide text-foreground'>
            Select Members
          </Text>
          <Text className='mt-1 text-center text-base text-muted-foreground'>
            {currentSeason?.name ?? 'New Season'}
          </Text>
        </View>

        {/* Member List */}
        <View className='gap-2 rounded-lg bg-card px-4 pt-4 pb-3 shadow-lg shadow-primary/10 border-2 border-primary/20'>
          <Text className='mb-1 text-sm text-muted-foreground'>
            Draft order will default to reverse of previous season standings.
          </Text>
          {sortedMemberScores?.toReversed()
            .filter(({ member }) => member.role !== 'Owner')
            .map(({ member }) => (
              <Pressable
                key={member.memberId}
                onPress={() => toggleMember(member.memberId, member.loggedIn)}
                disabled={member.loggedIn}>
                <ColorRow
                  className='flex-row items-center justify-between rounded-lg border-2 px-2'
                  color={member.color}>
                  <Text className='text-xl font-bold'>{member.displayName}</Text>
                  <Switch
                    value={selectedMembers.has(member.memberId)}
                    onValueChange={() => toggleMember(member.memberId, member.loggedIn)}
                    disabled={member.loggedIn}
                    trackColor={{ false: colors.destructive, true: colors.positive }}
                    thumbColor='white' />
                </ColorRow>
              </Pressable>
            ))}
        </View>
      </View>
    </ScrollView>
  );
}
