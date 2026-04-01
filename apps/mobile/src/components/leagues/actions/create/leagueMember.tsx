import { type Control, Controller } from 'react-hook-form';
import { TextInput, View, Text, Pressable } from 'react-native';
import { DISPLAY_NAME_MAX_LENGTH } from '~/lib/leagues';
import { twentyColors, colors } from '~/lib/colors';
import { Check, UserX2, User, Palette } from 'lucide-react-native';
import { getContrastingColor, hexToRgba, rgbaToHex } from '@uiw/color-convert';
import { cn } from '~/lib/utils';

interface LeagueMemberProps {
  control: Control<any>;
  usedColors?: string[];
  currentColor?: string;
  formPrefix?: string;
  className?: string;
  noHeader?: boolean;
  onSubmitEditing?: () => void;
}

export default function LeagueMember({
  control,
  usedColors,
  currentColor,
  formPrefix,
  noHeader,
  className,
  onSubmitEditing,
}: LeagueMemberProps) {
  if (control == null) {
    console.error('LeagueMember component requires a control prop from react-hook-form');
    return null;
  }

  return (
    <View className={cn('items-center justify-start', className)}>
      {/* Header Section */}
      {!noHeader && (
        <View className='mb-6 items-center'>
          <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
            <User size={24} color={colors.primary} />
          </View>
          <Text className='text-center text-xl font-black tracking-wide text-foreground'>
            Create Your Profile
          </Text>
          <Text className='mt-1 text-center text-base text-muted-foreground'>
            This is how you'll appear on the leaderboard
          </Text>
        </View>
      )}

      {/* Display Name Input */}
      <Controller
        control={control}
        name={formPrefix ? `${formPrefix}.displayName` : 'displayName'}
        render={({ field: { onChange, onBlur, value } }) => (
          <View className='w-full'>
            <Text className='mb-2 text-base font-medium text-muted-foreground'>Display Name</Text>
            <TextInput
              className={cn(
                'text-2xl rounded-lg border-2 border-primary/20 bg-card leading-tight p-4',
                value.length === 0 && 'italic border-primary/40'
              )}
              textAlignVertical='center'
              placeholder='Your display name'
              placeholderTextColor={colors['muted-foreground']}
              autoCapitalize='words'
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              maxLength={DISPLAY_NAME_MAX_LENGTH}
              returnKeyType='done'
              onSubmitEditing={onSubmitEditing}
              onTouchStart={(e) => e.stopPropagation()} />
            <View className='mt-1 flex-row items-center justify-end px-1'>
              <Text
                className={cn(
                  'text-sm text-muted-foreground',
                  value?.length >= DISPLAY_NAME_MAX_LENGTH && 'font-bold text-destructive'
                )}>
                {value?.length ?? 0}/{DISPLAY_NAME_MAX_LENGTH}
              </Text>
            </View>
          </View>
        )} />

      {/* Color Picker */}
      <Controller
        control={control}
        name={formPrefix ? `${formPrefix}.color` : 'color'}
        render={({ field: { onChange, onBlur, value } }) => (
          <View className='w-full'>
            <View className='mb-2 flex-row items-center gap-2'>
              <Palette size={16} color={colors['muted-foreground']} />
              <Text className='text-base font-medium text-muted-foreground'>Choose Your Color</Text>
            </View>
            <View className='flex-row flex-wrap justify-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3'>
              {twentyColors.map((originalColor) => {
                let displayColor = originalColor;
                let usedColor = false;

                if (usedColors?.includes(originalColor) && originalColor !== currentColor) {
                  const rgb = hexToRgba(originalColor);
                  const avg = Math.round((rgb.r + rgb.g + rgb.b) / 3);
                  displayColor = rgbaToHex({ r: avg, g: avg, b: avg, a: 1 });
                  usedColor = true;
                }

                const isSelected = value === originalColor;

                return (
                  <Pressable
                    key={originalColor}
                    onPress={() => {
                      if (usedColor) return;
                      onChange(originalColor);
                      onBlur();
                    }}
                    className={cn(
                      'h-10 w-1/5 items-center justify-center rounded-lg',
                      isSelected && 'border-2 border-white'
                    )}
                    style={{
                      backgroundColor: displayColor,
                      opacity: usedColor ? 0.5 : 1,
                    }}>
                    {isSelected && (
                      <Check size={22} color={getContrastingColor(displayColor)} strokeWidth={3} />
                    )}
                    {usedColor && (
                      <UserX2 size={18} color={getContrastingColor(displayColor)} />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )} />
    </View>
  );
}
