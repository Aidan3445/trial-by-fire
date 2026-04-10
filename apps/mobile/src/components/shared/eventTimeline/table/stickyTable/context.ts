import { createContext, useContext } from 'react';
import { type Animated } from 'react-native';

interface StickyScrollContextType {
  scrollX: Animated.Value;
}

export const StickyScrollContext = createContext<StickyScrollContextType | null>(null);

export function useStickyScroll() {
  const ctx = useContext(StickyScrollContext);
  if (!ctx) throw new Error('useStickyScroll must be used within StickyScrollView');
  return ctx;
}
