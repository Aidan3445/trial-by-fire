import { View, Text } from 'react-native';
import { Check, Clock, Lock } from 'lucide-react-native';
import { colors } from '~/lib/colors';

export default function StatusBadge({
  isOpen,
  isClosed,
  isResolved,
}: {
  isOpen: boolean;
  isClosed: boolean;
  isResolved: boolean;
}) {
  if (isOpen) {
    return (
      <View className='flex-row items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 border border-amber-500/30'>
        <Clock size={12} color='#f59e0b' />
        <Text className='text-sm font-bold text-amber-500'>OPEN</Text>
      </View>
    );
  }
  if (isClosed) {
    return (
      <View className='flex-row items-center gap-1 rounded-full bg-blue-500/15 px-2 py-0.5 border border-blue-500/30'>
        <Lock size={12} color='#3b82f6' />
        <Text className='text-sm font-bold text-blue-500'>CLOSED</Text>
      </View>
    );
  }
  if (isResolved) {
    return (
      <View className='flex-row items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 border border-primary/30'>
        <Check size={12} color={colors.primary} />
        <Text className='text-sm font-bold text-primary'>RESOLVED</Text>
      </View>
    );
  }
  return null;
}
