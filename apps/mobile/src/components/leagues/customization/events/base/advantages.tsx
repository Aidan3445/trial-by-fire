import { ChevronDown } from 'lucide-react-native';
import { Text, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import Button from '~/components/common/button';
import { useState, type ReactNode } from 'react';
import Collapsible from 'react-native-collapsible';
import { type UseFormReturn } from 'react-hook-form';
import { cn } from '~/lib/utils';
import { colors } from '~/lib/colors';
import EventField from '~/components/leagues/customization/events/base/eventField';

interface AdvantageScoreSettingsProps {
  disabled?: boolean;
  reactForm: UseFormReturn<any>;
  hidePrediction?: boolean;
  children?: ReactNode;
}

export default function AdvantageScoreSettings({
  disabled,
  reactForm,
  hidePrediction,
  children,
}: AdvantageScoreSettingsProps) {
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
      {/* Accordion Trigger */}
      <Button
        className={cn(
          'flex-row items-center justify-between rounded-lg border-2 border-primary/20 bg-primary/5 p-3 active:bg-primary/10 transition-all',
          !isCollapsed ? 'rounded-b-none duration-75' : 'delay-300 rounded-b-lg'
        )}
        onPress={toggleCollapsed}>
        <View className='flex-row items-center gap-2'>
          <View className='h-4 w-1 rounded-full bg-primary' />
          <Text className='text-base font-bold uppercase tracking-wider text-foreground'>
            Advantages
          </Text>
        </View>
        <Animated.View style={chevronStyle}>
          <ChevronDown size={20} color={colors.primary} />
        </Animated.View>
      </Button>

      {/* Accordion Content */}
      <Collapsible collapsed={isCollapsed}>
        <View className='gap-2 rounded-b-lg border-2 border-t-0 border-primary/20 bg-card p-3'>
          <EventField
            reactForm={reactForm}
            eventName='advFound'
            fieldPath='baseEventRules.advFound'
            disabled={disabled}
            hidePrediction={hidePrediction} />
          <EventField
            reactForm={reactForm}
            eventName='advPlay'
            fieldPath='baseEventRules.advPlay'
            disabled={disabled}
            hidePrediction={hidePrediction} />
          <EventField
            reactForm={reactForm}
            eventName='badAdvPlay'
            fieldPath='baseEventRules.badAdvPlay'
            disabled={disabled}
            hidePrediction={hidePrediction} />
          <EventField
            reactForm={reactForm}
            eventName='advElim'
            fieldPath='baseEventRules.advElim'
            disabled={disabled}
            hidePrediction={hidePrediction} />
          {children}
        </View>
      </Collapsible>
    </View>
  );
}
