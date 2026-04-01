import { type ReactNode } from 'react';
import { type GestureResponderEvent, TouchableOpacity } from 'react-native';
import { cn } from '~/lib/utils';

interface ButtonProps {
  onPress?: (_event: GestureResponderEvent) => void;
  onLongPress?: (_event: GestureResponderEvent) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export default function Button({
  onPress,
  onLongPress,
  disabled = false,
  className,
  children
}: ButtonProps) {
  return (
    <TouchableOpacity
      className={cn('disabled:opacity-50', className)}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={disabled}
      activeOpacity={0.7}>
      {children}
    </TouchableOpacity>
  );
}
