import { useState, useMemo } from 'react';
import { View, Text, Pressable, Switch } from 'react-native';
import { Recycle } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';
import ColorRow from '~/components/shared/colorRow';
import { useSeasons } from '~/hooks/seasons/useSeasons';
import { useRecreateLeague } from '~/hooks/leagues/mutation/useRecreateLeague';
import { colors } from '~/lib/colors';

interface RecreateLeagueProps {
  hash: string;
}

export default function RecreateLeague({ hash }: RecreateLeagueProps) {
  const { data: seasons } = useSeasons(true);
  const [isOpen, setIsOpen] = useState(false);

  const {
    sortedMemberScores,
    selectedMembers,
    toggleMember,
    handleSubmit,
    isSubmitting,
    ownerLoggedIn,
  } = useRecreateLeague(hash, () => setIsOpen(false));

  const currentSeason = useMemo(() => {
    if (!seasons || seasons.length === 0) return null;
    return seasons[0];
  }, [seasons]);

  return (
    <View>
      <Button
        className={`mt-2 w-full flex-row items-center justify-center gap-2 rounded-lg bg-primary py-2 active:opacity-80 ${!ownerLoggedIn ? 'opacity-50' : ''}`}
        onPress={() => setIsOpen(true)}>
        <Text className='text-sm font-bold text-white'>Clone League</Text>
        <Recycle size={16} color='white' />
      </Button>

      <Modal visible={isOpen} onClose={() => setIsOpen(false)}>
        {ownerLoggedIn ? (
          <View>
            {/* Header */}
            <View className='mb-2 flex-row items-center gap-2'>
              <View className='h-6 w-1 rounded-full bg-primary' />
              <View>
                <Text className='text-xl font-black text-foreground'>Clone League</Text>
                {currentSeason && (
                  <Text className='text-sm text-muted-foreground'>{currentSeason.name}</Text>
                )}
              </View>
            </View>

            {/* Description */}
            <Text className='mb-4 text-sm text-muted-foreground'>
              Select which members to add to the new league. The draft order will start from
              the losers of the previous season.
            </Text>

            {/* Member List */}
            <View className='mb-4 gap-2'>
              {sortedMemberScores?.toReversed().map(({ member }) => (
                <Pressable
                  key={member.memberId}
                  onPress={() => toggleMember(member.memberId, member.loggedIn)}
                  disabled={member.loggedIn}>
                  <ColorRow
                    className='flex-row items-center justify-between border-2 px-3 py-2'
                    color={member.color}>
                    <Text className='font-semibold'>
                      {member.displayName}
                    </Text>
                    <Switch
                      value={selectedMembers.has(member.memberId)}
                      onValueChange={() => toggleMember(member.memberId, member.loggedIn)}
                      disabled={member.loggedIn}
                      trackColor={{ false: '#00000030', true: colors.primary }}
                      thumbColor='white' />
                  </ColorRow>
                </Pressable>
              ))}
            </View>

            {/* Actions */}
            <View className='flex-row justify-end gap-2'>
              <Button
                className='rounded-lg border-2 border-primary/30 bg-transparent px-4 justify-center py-2 active:bg-primary/10'
                onPress={() => setIsOpen(false)}>
                <Text className='font-semibold text-foreground'>Cancel</Text>
              </Button>
              <Button
                className={`rounded-lg bg-primary px-4 justify-center py-2 active:opacity-80 ${selectedMembers.size === 0 || isSubmitting ? 'opacity-50' : ''
                  }`}
                disabled={selectedMembers.size === 0 || isSubmitting}
                onPress={handleSubmit}>
                <Text className='font-semibold text-white'>
                  {isSubmitting ? 'Cloning...' : 'Clone'}
                </Text>
              </Button>
            </View>
          </View>
        ) : (
          <View className='items-center py-2'>
            <Text className='text-center text-muted-foreground'>
              Only the league owner can clone this league.
            </Text>
            <Button
              className='mt-4 rounded-lg bg-primary px-4 py-2 active:opacity-80'
              onPress={() => setIsOpen(false)}>
              <Text className='font-semibold text-white'>OK</Text>
            </Button>
          </View>
        )}
      </Modal>
    </View>
  );
}
