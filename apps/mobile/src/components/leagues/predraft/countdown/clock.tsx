import { useFocusEffect } from 'expo-router';
import { type ReactNode, useState, useCallback } from 'react';
import { View, Text } from 'react-native';

interface ClockProps {
  endDate: Date | null;
  replacedBy?: ReactNode;
}

export default function Clock({ endDate, replacedBy }: ClockProps) {
  const [timer, setTimer] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!endDate) return;

      setTimer(endDate.getTime() - Date.now());

      // eslint-disable-next-line no-undef
      const interval = setInterval(() => {
        setTimer(endDate.getTime() - Date.now());
      }, 1000);

      return () => {
        // eslint-disable-next-line no-undef
        clearInterval(interval);
      };
    }, [endDate])
  );

  const days = timer ? Math.floor(timer / (1000 * 60 * 60 * 24)) : '--';
  const hours = timer ? Math.floor((timer / (1000 * 60 * 60)) % 24) : '--';
  const minutes = timer ? Math.floor((timer / (1000 * 60)) % 60) : '--';
  const seconds = timer ? Math.floor((timer / 1000) % 60) : '--';

  if (timer && timer <= 0) {
    return replacedBy;
  }

  return (
    <View className='w-full pb-2 px-1'>
      <View className='flex-row items-center justify-center max-w-2xl self-center'>
        <ClockPlace value={days.toString()} label={days === 1 ? 'Day' : 'Days'} />
        <View className='items-center justify-center px-1'>
          <Text className='text-3xl font-black text-primary'>:</Text>
        </View>
        <ClockPlace value={hours.toString()} label={hours === 1 ? 'Hour' : 'Hours'} />
        <View className='items-center justify-center px-1'>
          <Text className='text-3xl font-black text-primary'>:</Text>
        </View>
        <ClockPlace value={minutes.toString()} label={minutes === 1 ? 'Minute' : 'Minutes'} />
        <View className='items-center justify-center px-1'>
          <Text className='text-3xl font-black text-primary'>:</Text>
        </View>
        <ClockPlace value={seconds.toString()} label={seconds === 1 ? 'Second' : 'Seconds'} />
      </View>
    </View>
  );
}

interface ClockPlaceProps {
  value: string;
  label: string;
}

function ClockPlace({ value, label }: ClockPlaceProps) {
  return (
    <View className='w-[5rem] flex items-center justify-center bg-primary/5 border border-primary/20 rounded-lg'>
      <Text
        className='text-xl font-black text-primary'
        allowFontScaling={false}
        style={{ fontVariant: ['tabular-nums'] }}>
        {value.toString().padStart(2, '0')}
      </Text>
      <Text
        allowFontScaling={false}
        className='text-[10px] font-bold uppercase tracking-wider text-muted-foreground'>
        {label}
      </Text>
    </View>
  );
}
