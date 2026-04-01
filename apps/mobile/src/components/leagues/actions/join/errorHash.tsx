import { View, Text } from 'react-native';
import { AlertCircle, ArrowLeft } from 'lucide-react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';

interface ErrorHashProps {
  onBack: () => void;
}

export default function ErrorHash({ onBack }: ErrorHashProps) {
  return (
    <View className='items-center justify-center'>
      {/* Title Section */}
      <View className='mb-6 items-center'>
        <View className='mb-3 h-12 w-12 items-center justify-center rounded-full bg-destructive/20'>
          <AlertCircle size={24} color={colors.destructive} />
        </View>
        <Text className='text-center text-xl font-black tracking-wide text-destructive'>
          Invalid Invite
        </Text>
        <Text className='mt-1 text-center text-base text-muted-foreground'>
          This invite link is invalid or has expired
        </Text>
      </View>

      {/* Action */}
      <View className='w-full'>
        <Button
          className='flex-row items-center justify-center gap-2 rounded-lg border-2 border-primary/20 bg-card p-4 active:bg-primary/10'
          onPress={onBack}>
          <ArrowLeft size={20} color={colors.primary} />
          <Text className='font-bold text-primary'>Try Another Code</Text>
        </Button>
      </View>
    </View>
  );
}
