import { Pressable, Text, TextInput, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { getContrastingColor } from '@uiw/color-convert';
import { colors, twentyColors } from '~/lib/colors';
import { tribeNameTaken } from '~/lib/events';
import { cn } from '~/lib/utils';
import { type TribeInsert } from '~/types/tribes';

interface TribeFieldsProps {
  label: string;
  value: TribeInsert;
  onChange: (_value: TribeInsert) => void;
  /** Tribe names already in the season, other than this tribe's own */
  takenNames: string[];
  placeholder?: string;
  /** Shown after the name when it is taken */
  takenHint?: string;
  disabled?: boolean;
}

/**
  * Name and color for the tribe a tribe update creates, or renames after creating it
  */
export default function TribeFields({ label, value, onChange, takenNames, placeholder, takenHint, disabled }: TribeFieldsProps) {
  // Keep a color from outside the palette (the default, or one set on web) pickable
  const swatches = twentyColors.includes(value.tribeColor) ? twentyColors : [value.tribeColor, ...twentyColors];

  return (
    <View className={cn('gap-1', disabled && 'opacity-50')} pointerEvents={disabled ? 'none' : 'auto'}>
      <Text className='text-sm font-bold uppercase tracking-wider text-muted-foreground px-1'>
        {label}
      </Text>
      <TextInput
        className='w-full rounded-lg border-2 border-primary/20 bg-primary/5 px-3 py-2 text-foreground'
        placeholder={placeholder ?? 'Tribe name'}
        placeholderTextColor={colors.primary}
        maxLength={16}
        value={value.tribeName}
        onChangeText={(tribeName) => onChange({ ...value, tribeName })}
        editable={!disabled}
        returnKeyType='done' />
      {tribeNameTaken(value.tribeName, takenNames) && (
        <Text className='text-sm text-destructive px-1'>
          {value.tribeName.trim()} already exists{takenHint ? `, ${takenHint}` : ''}
        </Text>
      )}
      <View className='flex-row flex-wrap justify-center gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 p-3'>
        {swatches.map((color) => {
          const isSelected = value.tribeColor === color;
          return (
            <Pressable
              key={color}
              onPress={() => onChange({ ...value, tribeColor: color })}
              className={cn('h-8 w-1/6 items-center justify-center rounded-lg', isSelected && 'border-2 border-white')}
              style={{ backgroundColor: color }}>
              {isSelected && <Check size={18} color={getContrastingColor(color)} strokeWidth={3} />}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
