import { useState } from 'react';
import { View, Text, TextInput, ScrollView } from 'react-native';
import { Controller } from 'react-hook-form';
import { X, Plus, Sparkles } from 'lucide-react-native';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import SearchableSelect from '~/components/common/searchableSelect';
import { useCreateLivePrediction } from '~/hooks/livePredictions/mutation/useCreateLivePrediction';
import { type SeasonsDataQuery } from '~/types/seasons';
import { type LivePredictionTemplate } from '~/types/events';
import Button from '~/components/common/button';

interface CreateLivePredictionFormProps {
  seasonData: SeasonsDataQuery | null;
}

export default function CreateLivePredictionForm({ seasonData }: CreateLivePredictionFormProps) {
  const {
    form,
    episodeOptions,
    optionTypeOptions,
    optionType,
    options,
    templates,
    applyTemplate,
    setOptionType,
    addCustomOption,
    removeCustomOption,
    updateCustomOption,
    handleCreate,
    isSubmitting,
    canSubmit,
  } = useCreateLivePrediction(seasonData);

  const [newOptionLabel, setNewOptionLabel] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);

  const handleAddOption = () => {
    if (!newOptionLabel.trim()) return;
    addCustomOption(newOptionLabel.trim());
    setNewOptionLabel('');
  };

  return (
    <View className='rounded-xl border-2 border-primary/20 bg-card p-2 gap-2'>
      {/* Header */}
      <View className='flex-row items-center justify-between px-1'>
        <View className='flex-row items-center gap-2'>
          <View className='h-6 w-1 rounded-full bg-primary' />
          <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
            New Prediction
          </Text>
        </View>
        <Button
          onPress={() => setShowTemplates(!showTemplates)}
          className='flex-row items-center gap-1 rounded-lg border-2 border-primary/20 px-2 py-1 active:opacity-80'>
          <Sparkles size={14} color={colors.primary} />
          <Text className='text-sm font-bold text-primary'>Templates</Text>
        </Button>
      </View>

      {/* Templates */}
      {showTemplates && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className='gap-2 h-0'
          contentContainerStyle={{ gap: 8, paddingHorizontal: 4 }}>
          {templates.map((t, i) => (
            <TemplateChip
              key={i}
              template={t}
              onPress={() => {
                applyTemplate(t);
                setShowTemplates(false);
              }} />
          ))}
        </ScrollView>
      )}

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
              onSelect={onChange}
              placeholder='Select Episode' />
          )} />
      </View>

      {/* Title */}
      <View className='gap-1'>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
          Title
        </Text>
        <Controller
          control={form.control}
          name='title'
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className='flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10'
              placeholder='e.g. Who wins this challenge?'
              placeholderTextColor={colors.mutedForeground}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={64}
              returnKeyType='done' />
          )} />
      </View>

      {/* Description */}
      <View className='gap-1'>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
          Description
        </Text>
        <Controller
          control={form.control}
          name='description'
          render={({ field: { value, onChange, onBlur } }) => (
            <TextInput
              className='flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10'
              placeholder='Optional description'
              placeholderTextColor={colors.mutedForeground}
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              maxLength={256}
              returnKeyType='done' />
          )} />
      </View>

      {/* Option Type */}
      <View className='gap-1'>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
          Answer Type
        </Text>
        <View className='flex-row rounded-lg bg-accent p-1 gap-1'>
          {optionTypeOptions.map((opt) => (
            <Button
              key={opt.value}
              onPress={() => setOptionType(opt.value as 'Castaway' | 'Tribe' | 'Custom')}
              className={cn(
                'flex-1 items-center justify-center rounded-md py-2',
                optionType === opt.value ? 'bg-primary' : 'bg-transparent'
              )}>
              <Text
                className={cn(
                  'text-sm font-bold uppercase tracking-wider',
                  optionType === opt.value ? 'text-white' : 'text-muted-foreground'
                )}>
                {opt.label}
              </Text>
            </Button>
          ))}
        </View>
      </View>

      {/* Options List */}
      <View className='gap-1'>
        <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
          Options ({options.length})
        </Text>
        <View className='rounded-lg border-2 border-primary/10 bg-primary/5 p-2 gap-1'>
          {options.length === 0 && (
            <Text className='text-sm text-muted-foreground text-center py-2'>
              {optionType === 'Custom' ? 'Add custom options below' : 'No options available'}
            </Text>
          )}
          {options.map((opt, i) => (
            <View
              key={`${opt.label}-${i}`}
              className='flex-row items-center gap-2 rounded-lg bg-card px-3 py-2'>
              <View className='flex-1'>
                {optionType === 'Custom' ? (
                  <TextInput
                    className='flex-1 flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10'
                    value={opt.label}
                    onChangeText={(text) => updateCustomOption(i, text)}
                    maxLength={128}
                    placeholder='Option label'
                    placeholderTextColor={colors.mutedForeground} />
                ) : (
                  <Text className='text-base text-foreground'>{opt.label}</Text>
                )}
              </View>
              {opt.referenceType && (
                <Text className='text-sm text-muted-foreground'>
                  {opt.referenceType}
                </Text>
              )}
              {optionType === 'Custom' && (
                <Button
                  onPress={() => removeCustomOption(i)}
                  className='p-1 active:opacity-60'>
                  <X size={16} color={colors.destructive} />
                </Button>
              )}
            </View>
          ))}

          {/* Add custom option */}
          {optionType === 'Custom' && (
            <View className='flex-row items-center gap-2 pt-1'>
              <TextInput
                className='flex-1 flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 not-disabled:active:bg-primary/10'
                placeholder='New option...'
                placeholderTextColor={colors.mutedForeground}
                value={newOptionLabel}
                onChangeText={setNewOptionLabel}
                maxLength={128}
                returnKeyType='done'
                onSubmitEditing={handleAddOption} />
              <Button
                onPress={handleAddOption}
                disabled={!newOptionLabel.trim()}
                className={cn(
                  'rounded-lg bg-primary p-2.5 active:opacity-80',
                  !newOptionLabel.trim() && 'opacity-50'
                )}>
                <Plus size={18} color='white' />
              </Button>
            </View>
          )}
        </View>
      </View>

      {/* Submit */}
      <Button
        onPress={handleCreate}
        disabled={!canSubmit}
        className={cn(
          'rounded-lg bg-primary p-3 active:opacity-80',
          !canSubmit && 'opacity-50'
        )}>
        <Text className='text-center text-base font-bold uppercase tracking-wider text-white'>
          {isSubmitting ? 'Sending...' : 'Send Prediction'}
        </Text>
      </Button>
    </View>
  );
}

function TemplateChip({
  template,
  onPress,
}: {
  template: LivePredictionTemplate;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      className='rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 active:bg-primary/10'>
      <Text className='text-sm font-semibold text-foreground' numberOfLines={1}>
        {template.title}
      </Text>
      <Text className='text-sm text-muted-foreground'>
        {template.optionType}
      </Text>
    </Button>
  );
}
