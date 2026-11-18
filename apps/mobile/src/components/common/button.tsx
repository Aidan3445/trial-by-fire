import { type ComponentRef, type ReactNode, type Ref } from 'react';
import { type GestureResponderEvent, TouchableOpacity } from 'react-native';
import { cn } from '~/lib/utils';

interface ButtonProps {
  onPress?: (_event: GestureResponderEvent) => void;
  onLongPress?: (_event: GestureResponderEvent) => void;
  disabled?: boolean;
  activeOpacity?: number;
  className?: string;
  children: ReactNode;
  // Popovers measure their trigger through this
  ref?: Ref<ComponentRef<typeof TouchableOpacity>>;
}

export default function Button({
  onPress,
  onLongPress,
  disabled = false,
  activeOpacity = 0.7,
  className,
  children,
  ref
}: ButtonProps) {
  return (
    <TouchableOpacity
      ref={ref}
      className={cn('disabled:opacity-50', className)}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={activeOpacity}>
      {children}
    </TouchableOpacity>
  );
}
