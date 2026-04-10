import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';
import { ShieldCheck, ShieldAlert } from 'lucide-react-native';
import { type StreakMember } from '~/types/leagueMembers';
import ColorRow from '~/components/shared/colorRow';
import PointsCell from '~/components/shared/eventTimeline/table/row/pointsCell';
import Modal from '~/components/common/modal';

interface StreakRowProps {
  streakPointValue: number;
  streakMembers: StreakMember[];
  streaksMap: Record<number, Record<number, number>>; // memberId -> episodeNumber -> streakCount
  episodeNumber: number;
  shotInTheDarkStatus?: Record<
    number,
    { episodeNumber: number; status: 'pending' | 'saved' | 'wasted' } | null
  >;
}

export default function StreakRow({
  streakPointValue,
  streakMembers,
  streaksMap,
  episodeNumber,
  shotInTheDarkStatus,
}: StreakRowProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedStreakMember, setSelectedStreakMember] = useState<StreakMember | null>(null);

  const openMemberModal = (streakMember: StreakMember) => {
    setSelectedStreakMember(streakMember);
    setModalVisible(true);
  };

  const selectedShotStatus = selectedStreakMember
    ? shotInTheDarkStatus?.[selectedStreakMember.member.memberId]
    : null;
  const selectedShotUsedThisEpisode = selectedShotStatus?.episodeNumber === episodeNumber;

  return (
    <View className='flex-row items-center gap-4 border-b border-primary/10 bg-card px-4 py-2'>
      {/* Points */}
      <PointsCell points={streakPointValue} className='left-0 z-10 w-[10vw]' />

      {/* Members */}
      <View className='w-[75vw] flex-row flex-wrap gap-2'>
        {streakMembers.map(({ member, castaway, tribeColor }) => {
          const shotStatus = shotInTheDarkStatus?.[member.memberId];
          const shotUsedThisEpisode = shotStatus?.episodeNumber === episodeNumber;

          return (
            <Pressable key={member.memberId} onPress={() => openMemberModal({ member, castaway, tribeColor })}>
              <ColorRow className='flex-row items-center gap-1 text-sm' color={member.color}>
                <Text className='text-sm font-medium'>{member.displayName}</Text>
                {shotUsedThisEpisode && shotStatus.status === 'saved' && (
                  <ShieldCheck size={16} color='#16a34a' />
                )}
                {shotUsedThisEpisode && shotStatus.status === 'wasted' && (
                  <ShieldAlert size={16} color='#dc2626' />
                )}
              </ColorRow>
            </Pressable>
          );
        })}
      </View>

      {/* Member Streak Modal */}
      <Modal visible={modalVisible} onClose={() => setModalVisible(false)}>
        <Text className='text-center text-sm font-semibold uppercase tracking-wide'>
          Survival Streak
        </Text>
        <View className='my-2 h-px bg-primary/20' />
        {selectedStreakMember !== null && (
          <>
            {selectedStreakMember.castaway && (
              <View className='mb-2'>
                <ColorRow
                  className='flex-row items-center text-sm'
                  color={selectedStreakMember.tribeColor ?? '#AAAAAA'}>
                  <Text className='text-sm font-medium'>
                    {selectedStreakMember.castaway.shortName}
                  </Text>
                </ColorRow>
              </View>
            )}
            <Text className='text-sm'>
              Total streak: {streaksMap[selectedStreakMember.member.memberId]?.[episodeNumber] ?? 0}
            </Text>
            {selectedShotUsedThisEpisode && (
              <>
                <View className='my-2 h-px bg-primary/20' />
                <View className='flex-row items-center gap-1'>
                  {selectedShotStatus?.status === 'saved' ? (
                    <>
                      <ShieldCheck size={12} color='#16a34a' />
                      <Text className='text-xs font-semibold text-positive'>
                        Shot in the Dark saved their streak
                      </Text>
                    </>
                  ) : (
                    <>
                      <ShieldAlert size={12} color='#dc2626' />
                      <Text className='text-xs font-semibold text-destructive'>
                        Shot in the Dark was wasted
                      </Text>
                    </>
                  )}
                </View>
              </>
            )}
          </>
        )}
      </Modal>
    </View>
  );
}
