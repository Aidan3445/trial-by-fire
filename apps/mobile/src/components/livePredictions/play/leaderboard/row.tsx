import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { cn } from '~/lib/utils';
import { colors, rankBadgeColor, rankTextColor } from '~/lib/colors';
import { divideY } from '~/lib/ui';
import { PlaceIcon } from '~/components/icons/generated';
import { type LeaderboardEntry } from '~/types/events';
import { useChangeLeaderboardUsername } from '~/hooks/livePredictions/mutation/useChangeLeaderboardUsername';
import { Pencil } from 'lucide-react-native';
import Modal from '~/components/common/modal';
import Button from '~/components/common/button';

interface LeaderboardRowProps {
  entry: LeaderboardEntry;
  place: number;
  index: number;
  isYou: boolean;
}

export default function LeaderboardRow({ entry, place, index, isYou }: LeaderboardRowProps) {
  const { mutate, isPending } = useChangeLeaderboardUsername();
  const [modalVisible, setModalVisible] = useState(false);
  const [username, setUsername] = useState(entry.username ?? '');

  const handleSubmit = () => {
    if (!username.trim()) return;
    mutate(username.trim(), {
      onSuccess: () => setModalVisible(false),
    });
  };

  return (
    <>
      <View
        className={cn(
          'h-10 flex-row gap-0.5 px-0.5 py-1',
          divideY(index),
          isYou && 'bg-primary/10',
        )}>
        <View className='w-11 inline-flex items-center justify-center'>
          <PlaceIcon size={28} color={rankBadgeColor(place)} />
          <Text className={cn('absolute font-black tracking-tighter', rankTextColor(place))}>
            {place}
          </Text>
        </View>
        <View className='flex-1 flex-row items-center gap-2 pl-1'>
          <Text
            className={cn(
              'text-base',
              isYou ? 'font-bold text-primary' : 'font-semibold text-foreground'
            )}
            numberOfLines={1}>
            {isYou ? 'You' : entry.username}
          </Text>
          {isYou && (
            <Pressable onPress={() => setModalVisible(true)} hitSlop={8}>
              <Pencil color={colors.primary} size={16} />
            </Pressable>
          )}
          <Text className='text-sm text-muted-foreground ml-auto pr-1'>
            {entry.totalCorrect}/{entry.totalAnswered}
          </Text>
        </View>
        <View className='w-16 items-center justify-center'>
          <Text className={cn(
            'text-base font-black tracking-tighter',
            isYou ? 'text-primary' : 'text-foreground'
          )}>
            {Math.round(entry.accuracy * 100)}%
          </Text>
        </View>
      </View>

      <Modal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}>
        <View className='gap-4'>
          <View className='gap-1'>
            <Text className='text-lg font-black tracking-tight text-foreground'>
              Change Username
            </Text>
            <Text className='text-sm text-muted-foreground'>
              This is how you appear on the leaderboard.
            </Text>
          </View>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder='Enter username'
            placeholderTextColor={colors.mutedForeground}
            autoCorrect={false}
            autoCapitalize='none'
            maxLength={30}
            onSubmitEditing={handleSubmit}
            returnKeyType='done'
            className='flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10' />
          <View className='flex-row gap-2'>
            <Button
              className='flex-1 rounded-lg bg-muted p-3 active:opacity-80'
              onPress={() => setModalVisible(false)}>
              <Text className='text-center font-semibold text-foreground'>Cancel</Text>
            </Button>
            <Button
              className={cn(
                'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              )}
              disabled={!username.trim() || isPending}
              onPress={handleSubmit}>
              <Text className='text-center font-semibold text-white'>
                {isPending ? 'Saving...' : 'Save'}
              </Text>
            </Button>
          </View>
        </View>
      </Modal>
    </>
  );
}
