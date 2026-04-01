import { ChevronDown, Lock, Globe } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Button from '~/components/common/button';
import { useState } from 'react';
import Collapsible from 'react-native-collapsible';
import { Link } from 'expo-router';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';

interface ProtectionInfoProps {
  isProtected?: boolean;
}

export default function ProtectionInfo({ isProtected }: ProtectionInfoProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const expandProgress = useSharedValue(0);

  const toggleCollapsed = () => {
    setIsCollapsed((prev) => !prev);
    expandProgress.value = withTiming(isCollapsed ? 1 : 0, { duration: 200 });
  };

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(expandProgress.value, [0, 1], [0, 180])}deg` }],
  }));

  return (
    <View>
      <Button
        className={cn(
          'flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-2 active:bg-primary/10 transition-all',
          !isCollapsed ? 'rounded-b-none duration-75' : 'delay-300 rounded-b-lg'
        )}
        onPress={toggleCollapsed}>
        <View className='flex-row items-center gap-2'>
          {isProtected ? (
            <Lock size={14} color={colors.primary} />
          ) : (
            <Globe size={14} color={colors.primary} />
          )}
          <Text className='text-base font-medium text-muted-foreground w-max'>
            {isProtected ? 'This league is protected' : 'This league is public'}
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={16} color={colors.primary} />
        </Animated.View>
      </Button>

      <Collapsible collapsed={isCollapsed}>
        <View className='gap-2 rounded-b-lg border-2 border-t-0 border-primary/20 bg-card p-3'>
          <Text className='text-base text-muted-foreground'>
            {isProtected
              ? 'A league admin/owner will need to approve new members. You can make your league public to allow anyone with the link to join.'
              : 'Anyone with the link can join without approval. You can require approval by making your league protected.'}
          </Text>
          <Link href={'./settings'}>
            <Text className='text-base font-semibold text-primary'>
              Go to Settings →
            </Text>
          </Link>
        </View>
      </Collapsible>
    </View>
  );
}
