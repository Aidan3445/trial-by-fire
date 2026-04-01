import { useEditMember } from '~/hooks/leagues/mutation/useEditMember';
import LeagueMember from '~/components/leagues/actions/create/leagueMember';
import LeaveLeague from '~/components/leagues/predraft/settings/leaveLeague';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import { cn } from '~/lib/utils';

export default function EditMember() {
  const { reactForm, loggedInMember, usedColors, currentColor, handleSubmit, resetForm, isDirty } = useEditMember();

  if (!reactForm.control) {
    return null;
  }

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      {/* Header */}
      <View className='flex-row items-center gap-1 h-8'>
        <View className='h-6 w-1 bg-primary rounded-full' />
        <Text className='text-xl font-black uppercase tracking-tight'>
          Member Details
        </Text>
      </View>

      {/* Member Fields */}
      <LeagueMember
        control={reactForm.control}
        usedColors={usedColors}
        currentColor={currentColor}
        noHeader />

      {/* Action Buttons */}
      <View className='flex-row gap-2'>
        <Button
          className='flex-1 rounded-lg bg-destructive p-3 active:opacity-80'
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
          onPress={() => handleSubmit()}>
          <Text className='text-center font-semibold text-white'>Save</Text>
        </Button>
      </View>
      <LeaveLeague member={loggedInMember} />
    </View>
  );
}
