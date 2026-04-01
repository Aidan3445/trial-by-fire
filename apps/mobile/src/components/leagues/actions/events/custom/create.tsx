import { View, Text, TextInput, Pressable } from 'react-native';
import { Controller } from 'react-hook-form';
import { useCreateCustomEvent } from '~/hooks/leagues/mutation/useCreateCustomEvent';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import SearchableSelect from '~/components/common/searchableSelect';
import SearchableMultiSelect from '~/components/common/searchableMultiSelect';
import EpisodeEvents from '~/components/shared/eventTimeline/table/view';
import { useRouter } from 'expo-router';
import Button from '~/components/common/button';

export default function CreateCustomEvents() {
  const router = useRouter();
  const {
    leagueData,
    season,
    form,
    clearKey,
    clearReferences,
    selectedEvent,
    selectedEpisode,
    selectedReferences,
    episodeOptions,
    eventOptions,
    combinedReferenceOptions,
    handleCombinedReferenceSelection,
    mockEvent,
    handleCreate,
    isSubmitting,
    canSubmit,
    hasCustomRules,
  } = useCreateCustomEvent();

  const onSubmit = () => {
    void handleCreate();
  };

  // Empty state
  if (!hasCustomRules) {
    return (
      <View className='flex-1 bg-background items-center justify-center'>
        <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2'>
          <View className='items-center gap-2 py-4'>
            <Text className='text-xl font-bold uppercase tracking-wider text-muted-foreground'>
              No Custom Events
            </Text>
            <Text className='text-base text-muted-foreground text-center'>
              You can create custom event rules in Settings.
            </Text>
            <Button
              onPress={() => {
                router.dismissTo(`/leagues/${leagueData?.league?.hash}/settings`);
              }}>
              <Text className='text-base font-semibold text-primary'>
                Go to Settings →
              </Text>
            </Button>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className='flex-1 bg-background w-full gap-4'>
      {/* Form Card */}
      <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2'>
        {/* Header */}
        <View className='flex-row items-center gap-2 px-1'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            Create Custom Event
          </Text>
        </View>

        {/* Episode Select */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Episode
          </Text>
          <Controller
            control={form.control}
            name='episodeId'
            render={({ field: { value, onChange } }) => (
              <SearchableSelect
                options={episodeOptions}
                selectedValue={value}
                onSelect={(v) => {
                  onChange(v);
                  clearReferences();
                }}
                placeholder='Select Episode' />
            )} />
        </View>

        {/* Event Select */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Event
          </Text>
          <Controller
            control={form.control}
            name='customEventRuleId'
            render={({ field: { value, onChange } }) => (
              <SearchableSelect
                options={eventOptions}
                selectedValue={value}
                onSelect={(v) => {
                  onChange(v);
                  clearReferences();
                }}
                placeholder='Select Event'
                disabled={form.watch('episodeId') === undefined} />
            )} />
        </View>

        {/* Label Input */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Label (optional)
          </Text>
          <Controller
            control={form.control}
            name='label'
            render={({ field: { value, onChange, onBlur } }) => (
              <TextInput
                className={cn(
                  'w-full flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10',
                  !selectedEvent && 'opacity-50'
                )}
                placeholder='Label'
                placeholderTextColor={colors.primary}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                editable={!!selectedEvent}
                returnKeyType='done' />
            )} />
        </View>

        {/* References MultiSelect */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            References
          </Text>
          <Controller
            control={form.control}
            name='references'
            render={() => (
              <SearchableMultiSelect
                key={clearKey}
                options={combinedReferenceOptions}
                selectedValues={selectedReferences?.map((ref) => `${ref.type}_${ref.id}`)}
                onToggleSelect={(values) =>
                  form.setValue('references', handleCombinedReferenceSelection(values))
                }
                placeholder='Select References'
                disabled={!selectedEvent} />
            )} />
        </View>

        {/* Notes Input */}
        <View className='gap-1'>
          <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
            Notes (line separated)
          </Text>
          <Controller
            control={form.control}
            name='notes'
            render={({ field: { value } }) => (
              <TextInput
                className={cn(
                  'rounded-lg border-2 border-primary/20 bg-card px-2 py-2 text-base text-foreground min-h-20',
                  (!selectedReferences || selectedReferences.length === 0) && 'opacity-50'
                )}
                placeholder='Notes'
                placeholderTextColor={colors.primary}
                value={value?.join('\n') ?? ''}
                onChangeText={(text) => form.setValue('notes', text.split('\n'))}
                multiline
                textAlignVertical='top'
                editable={!!selectedReferences && selectedReferences.length > 0}
                returnKeyType='default' />
            )}
          />
        </View>

        {/* Submit Button */}
        <Pressable
          onPress={onSubmit}
          disabled={!canSubmit}
          className={cn(
            'rounded-lg bg-primary p-3 active:opacity-80',
            !canSubmit && 'opacity-50'
          )}>
          <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
            {isSubmitting ? 'Creating...' : 'Create'}
          </Text>
        </Pressable>
      </View>

      {/* Preview */}
      {season && (
        <View className='rounded-xl border border-accent bg-accent gap-2'>
          <EpisodeEvents
            className='rounded-xl overflow-hidden border border-accent'
            episodeNumber={selectedEpisode ?? 1}
            seasonData={season}
            leagueData={leagueData}
            mockEvents={mockEvent ? [mockEvent] : []}
            edit
            filters={{ castaway: [], tribe: [], member: [], event: [] }} />
        </View>
      )}
    </View>
  );
}
