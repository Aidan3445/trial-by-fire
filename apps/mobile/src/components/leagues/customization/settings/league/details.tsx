import { useState } from 'react';
import { Controller } from 'react-hook-form';
import { View, Text, TextInput, Switch } from 'react-native';
import { LEAGUE_NAME_MAX_LENGTH } from '~/lib/leagues';
import Button from '~/components/common/button';
import { useLeagueDetails } from '~/hooks/leagues/mutation/useLeagueSettings';
import { usePendingMembers } from '~/hooks/leagues/query/usePendingMembers';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import ManagePendingMembers from '~/components/leagues/customization/settings/league/manageMembers/modal';

export default function LeagueDetails() {
  const {
    reactForm,
    handleSubmit,
    resetForm,
    editable,
    isDirty,
  } = useLeagueDetails();

  const { data: pendingMembers } = usePendingMembers();
  const [isPendingModalOpen, setIsPendingModalOpen] = useState(false);

  if (!editable) return null;

  const isProtected = reactForm.watch('isProtected');
  const hasPendingMembers = (pendingMembers?.members.length ?? 0) > 0;

  const onSubmit = () => {
    void (async () => {
      await handleSubmit();
      // Open modal after saving if switching to public and there are pending members
      if (!reactForm.getValues('isProtected') && hasPendingMembers) {
        setIsPendingModalOpen(true);
      }
    })();
  };

  return (
    <>
      <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
        {/* Header */}
        <View className='flex-row items-center gap-1 h-8'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>League Details</Text>
        </View>

        {/* League Name */}
        <View>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground mb-1'>
            League Name
          </Text>
          <Controller
            control={reactForm.control}
            name='name'
            render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
              <View>
                <TextInput
                  className='w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-2 py-0 h-10 text-lg leading-tight overflow-hidden'
                  placeholder='League Name'
                  placeholderTextColor={colors.mutedForeground}
                  autoCapitalize='words'
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  maxLength={LEAGUE_NAME_MAX_LENGTH} />
                <Text className='mt-1 text-right text-sm text-muted-foreground'>
                  {value?.length || 0}/{LEAGUE_NAME_MAX_LENGTH}
                </Text>
                {error && <Text className='text-sm text-destructive'>{error.message}</Text>}
              </View>
            )} />
        </View>

        {/* Is Protected Toggle */}
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 px-3 py-2'>
          <View className='flex-row items-center justify-between'>
            <View className='flex-1'>
              <Text className='font-bold text-foreground'>Protected League</Text>
              <Text className='text-sm text-muted-foreground'>
                {isProtected
                  ? 'New members require approval to join'
                  : 'Anyone with the link can join'}
              </Text>
            </View>
            <Controller
              control={reactForm.control}
              name='isProtected'
              render={({ field }) => (
                <Switch
                  value={field.value}
                  onValueChange={field.onChange}
                  trackColor={{ false: colors.destructive, true: colors.positive }}
                  thumbColor='white' />
              )} />
          </View>
        </View>

        {/* Action Buttons */}
        <View className='flex-row gap-2'>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-destructive p-3 active:opacity-80',
              !isDirty && 'opacity-50'
            )}
            disabled={!isDirty}
            onPress={resetForm}>
            <Text className='text-center font-semibold text-white'>Cancel</Text>
          </Button>
          <Button
            className={cn(
              'flex-1 rounded-lg bg-primary p-3 active:opacity-80',
              !isDirty && 'opacity-50'
            )}
            disabled={!isDirty}
            onPress={onSubmit}>
            <Text className='text-center font-semibold text-white'>Save</Text>
          </Button>
        </View>
      </View>

      {/* Pending Members Modal */}
      <ManagePendingMembers isOpen={isPendingModalOpen} onClose={() => setIsPendingModalOpen(false)} />
    </>
  );
}
