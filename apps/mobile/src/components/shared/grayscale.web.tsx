import { View } from 'react-native';
import { type ReactNode } from 'react';

interface GrayscaleProps {
  amount?: number;
  children: ReactNode;
}

export default function Grayscale({ amount = 1, children }: GrayscaleProps) {
  return (
    <View style={{ filter: `grayscale(${amount})` }}>
      {children}
    </View>
  );
}
