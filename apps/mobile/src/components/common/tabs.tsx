import * as React from 'react';
import { View, Pressable, Text, type ViewProps, type PressableProps } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { cn } from '~/lib/utils';

type TabsContextValue = {
  value: string;
  onValueChange: (_value: string) => void;
};

const TabsContext = React.createContext<TabsContextValue | null>(null);

const useTabsContext = () => {
  const context = React.useContext(TabsContext);
  if (!context) {
    throw new Error('Tabs components must be used within a Tabs provider');
  }
  return context;
};

type TabsProps = ViewProps & {
  defaultValue: string;
  value?: string;
  onValueChange?: (_value: string) => void;
};

const Tabs = React.forwardRef<View, TabsProps>(
  ({ defaultValue, value: controlledValue, onValueChange, className, children, ...props }, ref) => {
    const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);

    const isControlled = controlledValue !== undefined;
    const value = isControlled ? controlledValue : uncontrolledValue;

    const handleValueChange = React.useCallback(
      (newValue: string) => {
        if (!isControlled) {
          setUncontrolledValue(newValue);
        }
        onValueChange?.(newValue);
      },
      [isControlled, onValueChange]
    );

    return (
      <TabsContext.Provider value={{ value, onValueChange: handleValueChange }}>
        <View ref={ref} className={cn('w-full', className)} {...props}>
          {children}
        </View>
      </TabsContext.Provider>
    );
  }
);
Tabs.displayName = 'Tabs';

const TabsList = React.forwardRef<View, ViewProps>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'flex-row h-12 items-center gap-1 justify-center bg-primary/5 p-1',
      className
    )}
    {...props}
  />
));
TabsList.displayName = 'TabsList';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type TabsTriggerProps = Omit<PressableProps, 'onPress'> & {
  value: string;
  className?: string;
  children: React.ReactNode;
};

const TabsTrigger = React.forwardRef<View, TabsTriggerProps>(
  ({ value, className, disabled, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = useTabsContext();
    const isActive = selectedValue === value;

    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ scale: withTiming(isActive ? 1 : 0.98, { duration: 150 }) }],
    }), [isActive]);

    return (
      <AnimatedPressable
        ref={ref}
        disabled={disabled}
        onPress={() => onValueChange(value)}
        style={animatedStyle}
        className={cn(
          'flex-row items-center justify-center rounded-sm px-3 py-2 bg-primary/10',
          isActive && 'bg-primary',
          disabled && 'opacity-50',
          className
        )}
        {...props}>
        <Text
          allowFontScaling={false}
          className={cn(
            'text-xs font-bold uppercase tracking-wider',
            isActive ? 'text-white' : 'text-black'
          )}>
          {children}
        </Text>
      </AnimatedPressable>
    );
  }
);
TabsTrigger.displayName = 'TabsTrigger';

type TabsContentProps = ViewProps & {
  value: string;
};

const TabsContent = React.forwardRef<View, TabsContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { value: selectedValue } = useTabsContext();

    if (selectedValue !== value) return null;

    return (
      <View ref={ref} className={cn('flex-col items-center', className)} {...props}>
        {children}
      </View>
    );
  }
);
TabsContent.displayName = 'TabsContent';

export { Tabs, TabsList, TabsTrigger, TabsContent };
