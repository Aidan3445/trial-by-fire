import { CircleAlert, Lock, LockOpen, Plus } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Button from '~/components/common/button';
import { useCustomEventRules } from '~/hooks/leagues/mutation/useCustomEventRules';
import CustomEventModal from '~/components/leagues/customization/events/custom/modal';
import CustomEventCard from '~/components/leagues/customization/events/custom/card';
import { colors } from '~/lib/colors';

export default function CustomEventRules() {
  const {
    reactForm,
    locked,
    setLocked,
    modalOpen,
    setModalOpen,
    handleSubmit,
    updateCustomEvent,
    deleteCustomEvent,
    disabled,
    customRules,
    leagueMembers
  } = useCustomEventRules();

  return (
    <View className='w-full rounded-xl bg-card p-2 border-2 border-primary/20 gap-2'>
      {/* Header */}
      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-1 h-8'>
          <View className='h-6 w-1 bg-primary rounded-full' />
          <Text className='text-xl font-black uppercase tracking-tight'>
            Custom Events
          </Text>
          <Text className='text-sm font-medium text-muted-foreground'>
            ({customRules.length}/6)
          </Text>
        </View>
        {!disabled && (
          <Button
            onPress={() => {
              if (locked) {
                setLocked(false);
              } else {
                setLocked(true);
                reactForm.reset();
              }
            }}>
            {locked ? (
              <Lock size={24} color={colors.primary} />
            ) : (
              <LockOpen size={24} color={colors.primary} />
            )}
          </Button>
        )}
      </View>

      {/* Description */}
      <View className='gap-2'>
        <Text className='text-base text-muted-foreground'>
          These <Text className='italic'>Custom Events</Text> let you make your league truly unique!
          Anything can be scored—from speaking the first word of the episode to orchestrating a
          blindside.{'\n'}The possibilities are endless!
        </Text>
        <Text className='text-base text-muted-foreground'>
          Custom events require manual scoring. Once your league drafts, you'll see a new tab on
          this page where you can score, edit and delete custom events during the season.
        </Text>
        <View>
          <Text className='text-base text-muted-foreground'>
            <Text className='italic'>Custom Events</Text> can be scored in two ways:
          </Text>
          <View className='ml-4 gap-1'>
            <Text className='text-base text-muted-foreground'>
              1. <Text className='font-bold'>Direct</Text>: Points are awarded like{' '}
              <Text className='italic'>Official Events</Text>, based on a player's pick.
            </Text>
            <Text className='text-base text-muted-foreground'>
              2. <Text className='font-bold'>Prediction</Text>: Points are awarded to members who
              correctly predict an event's outcome. Predictions can be made before each episode or
              at specific times throughout the season.
            </Text>
          </View>
        </View>
      </View>

      {/* Add Button */}
      {!disabled && !locked && (
        <Button
          className='flex-row items-center justify-center gap-2 rounded-lg bg-primary p-3 active:opacity-80'
          disabled={customRules.length >= 6}
          onPress={() => setModalOpen(true)}>
          {customRules.length >= 6 ? (
            <CircleAlert size={20} color='white' />
          ) : (
            <Plus size={20} color='white' />
          )}
          <Text className='font-semibold text-white'>
            {customRules.length >= 6 ? 'Custom Event Limit Reached' : 'Create New Custom Event'}
          </Text>
        </Button>
      )}

      {/* Custom Event Cards */}
      {customRules.length > 0 ? (
        <View className='gap-2'>
          {customRules.map(rule => (
            <CustomEventCard
              key={rule.customEventRuleId}
              rule={rule}
              locked={disabled || locked}
              onUpdate={updateCustomEvent}
              onDelete={deleteCustomEvent}
              leagueMembers={leagueMembers} />
          ))}
        </View>
      ) : (
        <Text className='text-base w-full text-center font-bold uppercase tracking-wider text-muted-foreground py-4'>
          No custom events created yet
        </Text>
      )}

      {/* Create Modal */}
      <CustomEventModal
        type='Create'
        isVisible={modalOpen}
        onClose={() => {
          setModalOpen(false);
          reactForm.reset();
        }}
        onSubmit={() => handleSubmit()}
        reactForm={reactForm} />
    </View>
  );
}
