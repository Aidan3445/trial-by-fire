import { useState } from 'react';
import { Platform, Pressable, Switch, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Calendar, Clock } from 'lucide-react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';
import { cn } from '~/lib/utils';
import { defaultRuntime, type EpisodeDraft } from '~/hooks/seasons/mutation/useSaveEpisode';

interface EpisodeEditorProps {
  initial: EpisodeDraft;
  /** Whether the episode already exists (update) or not (create) */
  existing: boolean;
  /** Episode numbers other episodes of the season already use */
  takenNumbers: number[];
  isSaving: boolean;
  onSave: (_draft: EpisodeDraft) => void;
}

const parseCount = (text: string) => (/^\d+$/.test(text) ? parseInt(text, 10) : NaN);

/**
 * Edit an episode's details; mount it fresh (with a key) for each episode
 */
export default function EpisodeEditor({ initial, existing, takenNumbers, isSaving, onSave }: EpisodeEditorProps) {
  const [numberText, setNumberText] = useState(String(initial.episodeNumber));
  const [title, setTitle] = useState(initial.title);
  const [airDate, setAirDate] = useState(initial.airDate);
  const [runtimeText, setRuntimeText] = useState(String(initial.runtime));
  const [isMerge, setIsMerge] = useState(initial.isMerge);
  const [isFinale, setIsFinale] = useState(initial.isFinale);
  // The runtime follows the finale switch until it's set by hand
  const [runtimeTouched, setRuntimeTouched] = useState(existing);
  const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(null);

  const episodeNumber = parseCount(numberText);
  const runtime = parseCount(runtimeText);
  const numberTaken = takenNumbers.includes(episodeNumber);
  const valid = episodeNumber > 0 && runtime > 0 && title.trim() !== '' && !numberTaken;

  const followRuntime = (number: number, finale: boolean) => {
    if (!runtimeTouched && number > 0) setRuntimeText(String(defaultRuntime(number, finale)));
  };

  // Keep the time when picking a date, and the date when picking a time
  const pickDate = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setAndroidPicker(null);
    if (!date) return;
    const next = new Date(airDate);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setAirDate(next);
  };
  const pickTime = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setAndroidPicker(null);
    if (!date) return;
    const next = new Date(airDate);
    next.setHours(date.getHours(), date.getMinutes(), 0, 0);
    setAirDate(next);
  };

  const save = () => {
    if (!valid) return;
    onSave({ episodeNumber, title: title.trim(), airDate, runtime, isMerge, isFinale });
  };

  const inputClass = 'rounded-lg border-2 border-primary/20 bg-primary/5 px-3 h-10 text-base text-foreground';

  return (
    <View className='gap-3'>
      <Text className='text-xl font-black uppercase tracking-tight text-foreground'>
        {existing ? `Edit Episode ${initial.episodeNumber}` : 'New Episode'}
      </Text>

      <View className='flex-row gap-2'>
        <View className='w-20 gap-1'>
          <Text className='text-sm font-bold uppercase text-muted-foreground'>Episode</Text>
          <TextInput
            className={inputClass}
            value={numberText}
            onChangeText={(text) => {
              setNumberText(text);
              followRuntime(parseCount(text), isFinale);
            }}
            keyboardType='number-pad' />
        </View>
        <View className='flex-1 gap-1'>
          <Text className='text-sm font-bold uppercase text-muted-foreground'>Title</Text>
          <TextInput
            className={inputClass}
            value={title}
            onChangeText={setTitle}
            placeholder='Episode title'
            placeholderTextColor={colors['muted-foreground']} />
        </View>
      </View>
      {numberTaken && (
        <Text className='text-sm text-destructive'>Another episode is already number {episodeNumber}.</Text>
      )}

      {/* Air date and time, in this device's time zone */}
      <View className='flex-row gap-2'>
        <Pressable
          onPress={() => Platform.OS === 'android' && setAndroidPicker('date')}
          className='flex-1 flex-row items-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2'>
          <Calendar size={18} color={colors.primary} />
          {Platform.OS === 'ios' ? (
            <DateTimePicker value={airDate} onChange={pickDate} accentColor={colors.card} mode='date' />
          ) : (
            <Text className='text-base text-foreground'>{airDate.toLocaleDateString()}</Text>
          )}
        </Pressable>
        <Pressable
          onPress={() => Platform.OS === 'android' && setAndroidPicker('time')}
          className='flex-1 flex-row items-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2'>
          <Clock size={18} color={colors.primary} />
          {Platform.OS === 'ios' ? (
            <DateTimePicker value={airDate} onChange={pickTime} accentColor={colors.card} mode='time' />
          ) : (
            <Text className='text-base text-foreground'>
              {airDate.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
            </Text>
          )}
        </Pressable>
      </View>
      {Platform.OS === 'android' && androidPicker && (
        <DateTimePicker
          value={airDate}
          onChange={androidPicker === 'date' ? pickDate : pickTime}
          mode={androidPicker} />
      )}

      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <Text className='text-sm font-bold uppercase text-muted-foreground'>Runtime</Text>
          <TextInput
            className={cn(inputClass, 'w-16 text-center')}
            value={runtimeText}
            onChangeText={(text) => {
              setRuntimeText(text);
              setRuntimeTouched(true);
            }}
            keyboardType='number-pad' />
          <Text className='text-sm text-muted-foreground'>min</Text>
        </View>
      </View>

      <View className='flex-row items-center justify-between'>
        <View className='flex-row items-center gap-2'>
          <Switch
            value={isMerge}
            onValueChange={setIsMerge}
            trackColor={{ false: colors.accent, true: colors.primary }}
            thumbColor='white' />
          <Text className='text-base font-semibold text-foreground'>Merge</Text>
        </View>
        <View className='flex-row items-center gap-2'>
          <Switch
            value={isFinale}
            onValueChange={(finale) => {
              setIsFinale(finale);
              followRuntime(episodeNumber, finale);
            }}
            trackColor={{ false: colors.accent, true: colors.primary }}
            thumbColor='white' />
          <Text className='text-base font-semibold text-foreground'>Finale</Text>
        </View>
      </View>

      <Button
        className={cn(
          'mt-1 items-center justify-center rounded-lg bg-primary p-3',
          (!valid || isSaving) && 'opacity-50'
        )}
        disabled={!valid || isSaving}
        onPress={save}>
        <Text className='text-center text-lg font-semibold text-white'>
          {isSaving ? 'Saving...' : existing ? 'Update' : 'Create'}
        </Text>
      </Button>
    </View>
  );
}
