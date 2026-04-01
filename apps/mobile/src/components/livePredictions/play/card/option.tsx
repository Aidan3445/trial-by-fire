import { View, Text } from 'react-native';
import { Check } from 'lucide-react-native';
import Button from '~/components/common/button';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';

export default function OptionRow({
  label,
  isSelected,
  isCorrectOption,
  showResults,
  pct,
  isOpen,
  disabled,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  isCorrectOption: boolean;
  showResults: boolean;
  pct: number;
  responseCount: number;
  isOpen: boolean;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <Button
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'relative overflow-hidden rounded-lg px-3 py-2.5',
        isCorrectOption && 'bg-positive/10 border-2 border-positive/30',
        isSelected && !isCorrectOption && 'bg-primary/10 border-2 border-primary/30',
        !isSelected && !isCorrectOption && 'bg-primary/5 border-2 border-primary/10',
        isOpen && !isSelected && !disabled && 'active:bg-primary/15',
      )}>
      {/* Percentage bar background */}
      {showResults && (
        <View
          className={cn(
            'absolute left-0 top-0 bottom-0 rounded-lg',
            isCorrectOption ? 'bg-positive/15' : 'bg-primary/10'
          )}
          style={{ width: `${pct}%` }} />
      )}

      <View className='flex-row items-center justify-between z-10'>
        <View className='flex-row items-center gap-2 flex-1'>
          {isSelected && (
            <View className={cn(
              'w-5 h-5 rounded-full items-center justify-center',
              isCorrectOption ? 'bg-positive' : 'bg-primary'
            )}>
              <Check size={12} color='white' />
            </View>
          )}
          {isCorrectOption && !isSelected && (
            <Check size={16} color={colors.positive} />
          )}
          <Text className={cn(
            'text-base flex-1',
            isCorrectOption ? 'font-bold text-positive' : isSelected ? 'font-semibold text-foreground' : 'text-foreground'
          )}>
            {label}
          </Text>
        </View>
        {showResults && (
          <Text className='text-sm text-muted-foreground'>
            {pct}%
          </Text>
        )}
      </View>
    </Button>
  );
}
