import { type ReactNode } from 'react';
import { Keyboard, TouchableWithoutFeedback } from 'react-native';

interface KeyboardContainerProps {
  children: ReactNode;
}

export default function KeyboardContainer({ children }: KeyboardContainerProps) {
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}>
      {children}
    </TouchableWithoutFeedback>
  );
}
