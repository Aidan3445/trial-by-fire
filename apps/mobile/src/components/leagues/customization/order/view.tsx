'use client';
import { View, Text } from 'react-native';
import Button from '~/components/common/button';
import { cn } from '~/lib/utils';
import { GripVertical, Lock, LockOpen } from 'lucide-react-native';
import DraggableFlatList, { type RenderItemParams } from 'react-native-draggable-flatlist';
import {
  type MemberWithId,
  useUpdateDraftOrder
} from '~/hooks/leagues/mutation/useUpdateDraftOrder';
import { colors } from '~/lib/colors';
import ColorRow from '~/components/shared/colorRow';

interface DraftOrderProps {
  className?: string;
}

export default function DraftOrder({ className }: DraftOrderProps) {
  const {
    orderLocked,
    setLocked,
    order,
    setOrder,
    resetOrder,
    orderChanged,
    leagueMembers,
    handleSubmit
  } = useUpdateDraftOrder();

  const renderItem = ({ item, getIndex, drag, isActive }: RenderItemParams<MemberWithId>) => (
    <Button
      onLongPress={orderLocked ? undefined : drag}
      disabled={isActive}
      className={cn('mb-2', isActive && 'opacity-50')}>
      <ColorRow
        className='flex-row items-center rounded-lg px-4'
        color={item.color}>
        <View
          className='w-8 h-8 items-center justify-center rounded-md'
          style={{
            backgroundColor: `${item.color}40`,
            borderWidth: 2,
            borderColor: `${item.color}66`,
          }}>
          <Text className='font-black text-sm'>
            {(getIndex() ?? 0) + 1}
          </Text>
        </View>
        <Text className={cn(
          'ml-4 flex-1 text-xl font-semibold',
          item.loggedIn && 'text-primary'
        )}>
          {item.displayName}
        </Text>
        {!orderLocked && (
          <GripVertical size={24} color='black' />
        )}
      </ColorRow>
    </Button>
  );

  return (
    <View className={cn('w-full rounded-xl bg-card p-2 border-2 border-primary/20', className)}>
      <View className='flex-row items-center justify-between mb-1'>
        <View className='flex-row items-center gap-1'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Draft Status
          </Text>
        </View>
        <View className='flex-row items-center gap-2'>
          {leagueMembers?.loggedIn?.role === 'Owner' && (
            <Button
              onPress={() => {
                if (orderLocked) {
                  setLocked(false);
                } else {
                  resetOrder();
                  setLocked(true);
                }
              }}>
              {orderLocked ? (
                <Lock size={24} color={colors.primary} />
              ) : (
                <LockOpen size={24} color={colors.secondary} />
              )}
            </Button>
          )}
        </View>
      </View>
      {!orderLocked && (
        <View className='flex-row gap-2'>
          <Button
            className={'flex-1 rounded-lg bg-destructive p-3'}
            onPress={() => {
              resetOrder();
              setLocked(true);
            }}>
            <Text className='text-center font-semibold text-white'>Cancel</Text>
          </Button>
          <Button
            className={'flex-1 rounded-lg bg-primary p-3'}
            disabled={!orderChanged}
            onPress={handleSubmit}>
            <Text className='text-center font-semibold text-white'>Save</Text>
          </Button>
        </View>
      )}
      {!orderLocked && (
        <Text className='text-base text-muted-foreground mb-1'>Tap and hold to drag and reorder</Text>
      )}
      <DraggableFlatList
        data={order}
        onDragEnd={({ data }) => !orderLocked && setOrder(data)}
        keyExtractor={item => String(item.id)}
        renderItem={renderItem}
        scrollEnabled={false}
        activationDistance={orderLocked ? 999999 : 2} />
    </View>
  );
}
