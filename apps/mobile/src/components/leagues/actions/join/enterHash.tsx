import { TextInput, View, Text } from 'react-native';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import { Link } from 'lucide-react-native';

interface EnterHashProps {
  value: string;
  onChangeText: (_text: string) => void;
}

export default function EnterHash({ value, onChangeText, }: EnterHashProps) {
  const handleChangeText = (text: string) => {
    onChangeText(text);
  };

  return (
    <View className='items-center justify-center'>
      {/* Title Section */}
      <View className='mb-6 items-center'>
        <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-primary/20'>
          <Link size={24} color={colors.primary} />
        </View>
        <Text className='text-center text-xl font-black tracking-wide text-foreground'>
          Enter League Code
        </Text>
        <Text className='mt-1 text-center text-base text-muted-foreground'>
          Enter the code or paste the invite link
        </Text>
      </View>

      {/* Input */}
      <View className='w-full'>
        <TextInput
          className={cn(
            'text-xl rounded-lg border-2 border-primary/20 bg-card leading-tight p-4',
            value.length === 0 && 'italic border-primary/40'
          )}
          textAlignVertical='center'
          placeholder='Paste code or link...'
          placeholderTextColor={colors['muted-foreground']}
          autoCapitalize='none'
          autoCorrect={false}
          onChangeText={handleChangeText}
          value={value}
          returnKeyType='next'
          onTouchStart={(e) => e.stopPropagation()} />
      </View>
    </View>
  );
}
