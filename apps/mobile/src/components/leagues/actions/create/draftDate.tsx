import { type Control, Controller } from 'react-hook-form';
import { View, Text, Platform, Pressable } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { colors } from '~/lib/colors';
import Button from '~/components/common/button';
import { Calendar, Clock, Zap } from 'lucide-react-native';
import { useState } from 'react';

interface DraftDateProps {
  control: Control<any>;
  editing?: boolean;
  onDraftJoin?: () => void;
}

function formatDate(date: Date) {
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

function formatTime(date: Date) {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit'
  });
}

export default function DraftDate({ control, editing, onDraftJoin }: DraftDateProps) {
  const [androidPicker, setAndroidPicker] = useState<'date' | 'time' | null>(null);

  return (
    <View className='items-center justify-center'>
      {/* Title Section */}
      <View className='mb-6 items-center'>
        <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
          <Calendar size={24} color={colors.primary} />
        </View>
        <Text className='text-center text-xl font-black tracking-wide text-foreground'>
          Schedule Your Draft
        </Text>
        <Text className='mt-1 text-center text-base text-muted-foreground'>
          {!editing ? 'Optional - you can start manually anytime' : 'Set a date or start now'}
        </Text>
      </View>

      <Controller
        control={control}
        name='draftDate'
        render={({ field: { onChange, onBlur, value } }) => {
          const currentValue = value ?? new Date(Date.now() + 604800000);

          const handleDateChange = (_: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === 'android') setAndroidPicker(null);
            if (!date) return;
            const prev = value ?? new Date();
            const newDate = new Date(date);
            newDate.setHours(prev.getHours());
            newDate.setMinutes(prev.getMinutes());
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            onChange(newDate);
            onBlur();
          };

          const handleTimeChange = (_: DateTimePickerEvent, date?: Date) => {
            if (Platform.OS === 'android') setAndroidPicker(null);
            if (!date) return;
            const prev = value ?? new Date();
            const newDate = new Date(prev);
            newDate.setHours(date.getHours());
            newDate.setMinutes(date.getMinutes());
            newDate.setSeconds(0);
            newDate.setMilliseconds(0);
            onChange(newDate);
            onBlur();
          };

          return (
            <View className='w-full items-center gap-4'>
              {/* Manual Start Button (editing mode only) */}
              {editing && (
                <Button
                  className='w-full flex-row items-center justify-center gap-2 rounded-lg border-2 border-primary/30 bg-accent py-3 active:bg-primary/10'
                  onPress={() => {
                    onChange(new Date());
                    onBlur();
                    onDraftJoin?.();
                  }}>
                  <Zap size={18} color={colors.primary} />
                  <Text className='font-semibold text-primary'>Start Draft Now</Text>
                </Button>
              )}

              {/* Date/Time Picker Cards */}
              <View className='w-full gap-3'>
                {/* Date Picker */}
                <Pressable
                  onPress={() => Platform.OS === 'android' && setAndroidPicker('date')}
                  className='flex-row items-center rounded-lg border-2 border-primary/20 bg-card px-4 py-3'>
                  <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-primary/20'>
                    <Calendar size={20} color={colors.primary} />
                  </View>
                  <Text className='flex-1 font-medium text-foreground'>Date</Text>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      minimumDate={new Date()}
                      maximumDate={new Date(Date.now() + 15778476000)}
                      value={currentValue}
                      onChange={handleDateChange}
                      accentColor={colors.card}
                      mode='date' />
                  ) : (
                    <View className='p-1 border-2 border-primary/20 rounded-lg bg-primary/10'>
                      <Text className='text-base text-primary font-medium'>
                        {formatDate(currentValue)}
                      </Text>
                    </View>
                  )}
                </Pressable>

                {/* Time Picker */}
                <Pressable
                  onPress={() => Platform.OS === 'android' && setAndroidPicker('time')}
                  className='flex-row items-center rounded-lg border-2 border-primary/20 bg-card px-4 py-3'>
                  <View className='mr-3 h-10 w-10 items-center justify-center rounded-lg bg-primary/20'>
                    <Clock size={20} color={colors.primary} />
                  </View>
                  <Text className='flex-1 font-medium text-foreground'>Time</Text>
                  {Platform.OS === 'ios' ? (
                    <DateTimePicker
                      minimumDate={new Date()}
                      value={currentValue}
                      onChange={handleTimeChange}
                      accentColor={colors.card}
                      mode='time' />
                  ) : (
                    <View className='p-1 border-2 border-primary/20 rounded-lg bg-primary/10'>
                      <Text className='text-base text-primary font-medium'>
                        {formatTime(currentValue)}
                      </Text>
                    </View>
                  )}
                </Pressable>
              </View>

              {/* Android modal pickers */}
              {Platform.OS === 'android' && androidPicker === 'date' && (
                <DateTimePicker
                  minimumDate={new Date()}
                  maximumDate={new Date(Date.now() + 15778476000)}
                  value={currentValue}
                  onChange={handleDateChange}
                  mode='date' />
              )}
              {Platform.OS === 'android' && androidPicker === 'time' && (
                <DateTimePicker
                  minimumDate={new Date()}
                  value={currentValue}
                  onChange={handleTimeChange}
                  mode='time' />
              )}

              {/* Tip */}
              <View className='mt-2 rounded-lg bg-card px-4 py-3 w-full border-2 border-primary/20'>
                <Text className='text-center text-base text-muted-foreground'>
                  Draft after the premiere to meet
                  the castaways first!
                </Text>
              </View>
            </View>
          );
        }} />
    </View>
  );
}
