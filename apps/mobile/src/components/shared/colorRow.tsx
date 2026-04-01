'use client';

import { type ReactNode } from 'react';
import { View } from 'react-native';
import { cn } from '~/lib/utils';

interface ColorRowProps {
  color: string;
  opaque?: boolean;
  className?: string;
  children: ReactNode;
}

export const ColorRowClassNames = {
  base: 'w-full flex flex-row p-0.5 pr-0 gap-4 text-nowrap items-center rounded-md border-t border-b border-r border-transparent',
};

export default function ColorRow({ color, opaque, className, children }: ColorRowProps) {
  return (
    <View
      className={cn(
        ColorRowClassNames.base,
        className
      )}
      style={{
        backgroundColor: `${color ?? '#AAAAAA'}${opaque ? '80' : '40'}`,
        borderLeftColor: color ?? '#000000',
        borderLeftWidth: 4,
      }}>
      {children}
    </View>
  );
}
