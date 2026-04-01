'use client';

import { Animated } from 'react-native';
import { type LucideIcon } from 'lucide-react-native';
import Button from '~/components/common/button';
import { colors } from '~/lib/colors';

type HeaderButtonProps = {
  opacity: Animated.Value;
  enabled: boolean;
  onPress: () => void;
  icon: LucideIcon;
  position: 'left' | 'right';
};

export function HeaderButton({ opacity, enabled, onPress, icon: Icon, position }: HeaderButtonProps) {
  return (
    <Animated.View
      style={{ opacity }}
      pointerEvents={enabled ? 'auto' : 'none'}
      className={`absolute ${position}-4`}>
      <Button className='px-4' onPress={onPress}>
        <Icon color={colors.primary} size={24} />
      </Button>
    </Animated.View>
  );
}

