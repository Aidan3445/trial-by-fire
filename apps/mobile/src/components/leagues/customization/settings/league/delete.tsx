import { View, Text, TextInput } from 'react-native';
import Button from '~/components/common/button';
import { useDeleteLeague } from '~/hooks/leagues/mutation/useDeleteLeague';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';

export default function DeleteLeague() {
  const {
    league,
    confirmName,
    setConfirmName,
    isSubmitting,
    isOwner,
    isInactive,
    canDelete,
    handleDelete
  } = useDeleteLeague();

  if (!isOwner) return null;

  return (
    <View
      className={cn(
        'w-full rounded-xl bg-card p-2 border-2 border-destructive/20 gap-2',
        isInactive && 'opacity-50'
      )}>
      {/* Header */}
      <View className='flex-row items-center gap-1 h-8'>
        <View className='h-6 w-1 bg-destructive rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight text-destructive'>
          Delete League
        </Text>
      </View>

      {/* Warning */}
      <Text className='text-base text-muted-foreground'>
        Deleting a league is permanent and cannot be undone. All data associated with the league
        will be lost. Please type the league name to confirm deletion.
      </Text>

      {/* Confirm Input */}
      <View>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
          League Name
        </Text>
        <Text className='text-sm text-muted-foreground mb-1'>
          Type the league name to confirm deletion
        </Text>
        <TextInput
          className='text-nowrap rounded-lg border-2 border-primary/20 bg-card px-2 py-1 text-left text-base leading-5'
          numberOfLines={1}
          placeholder={`Enter "${league?.name ?? 'League Name'}" to confirm`}
          placeholderTextColor={colors.primary}
          value={confirmName}
          onChangeText={setConfirmName}
          editable={!isInactive} />
      </View>

      {/* Delete Button */}
      <Button
        className={cn(
          'rounded-lg bg-destructive p-3 active:opacity-80',
          !canDelete && 'opacity-50'
        )}
        disabled={!canDelete}
        onPress={handleDelete}>
        <Text className='text-center font-semibold text-white'>
          {isSubmitting ? 'Deleting...' : 'Delete League'}
        </Text>
      </Button>

      {isInactive && (
        <Text className='text-sm text-destructive'>
          This league is already inactive and cannot be deleted.
        </Text>
      )}
    </View>
  );
}
