import { type Control, Controller } from 'react-hook-form';
import { TextInput, View, Text } from 'react-native';
import { LEAGUE_NAME_MAX_LENGTH } from '~/lib/leagues';
import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { Type } from 'lucide-react-native';

const placeholderOptions = ['Jeff Probst Fan Club', 'Torch Snuffers', 'Jury\'s Out'];

interface LeagueNameProps {
  control: Control<any>;
  onSubmitEditing?: () => void;
  canGoNext?: boolean;
}

export default function LeagueName({ control, onSubmitEditing, canGoNext }: LeagueNameProps) {
  const [placeholder, setPlaceholder] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line no-undef
    const interval = setInterval(() => {
      setPlaceholder((prev) => (prev + 1) % placeholderOptions.length);
    }, 2000);
    // eslint-disable-next-line no-undef
    return () => clearInterval(interval);
  }, []);

  return (
    <View className='items-center justify-center'>
      {/* Title Section */}
      <View className='mb-6 items-center'>
        <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
          <Type size={24} color={colors.primary} />
        </View>
        <Text className='text-center text-xl font-black tracking-wide text-foreground'>
          Name Your League
        </Text>
        <Text className='mt-1 text-center text-base text-muted-foreground'>
          You can always change this later
        </Text>
      </View>

      {/* Input */}
      <Controller
        control={control}
        name='leagueName'
        render={({ field: { onChange, onBlur, value } }) => (
          <View className='w-full'>
            <TextInput
              className={cn(
                'text-xl rounded-lg border-2 border-primary/20 bg-card leading-tight p-4',
                value.length === 0 && 'italic border-primary/40'
              )}
              textAlignVertical='center'
              placeholder={placeholderOptions[placeholder]}
              placeholderTextColor={colors['muted-foreground']}
              autoCapitalize='words'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              maxLength={LEAGUE_NAME_MAX_LENGTH}
              returnKeyType='done'
              onSubmitEditing={canGoNext ? onSubmitEditing : undefined}
              onTouchStart={(e) => e.stopPropagation()} />
            <View className='mt-2 flex-row items-center justify-end px-1'>
              <Text
                className={cn(
                  'text-sm text-muted-foreground',
                  value.length >= LEAGUE_NAME_MAX_LENGTH && 'font-bold text-destructive'
                )}>
                {value.length}/{LEAGUE_NAME_MAX_LENGTH}
              </Text>
            </View>
          </View>
        )} />
    </View>
  );
}
