import { createContext, useContext } from 'react';
import { type SharedValue } from 'react-native-reanimated';

interface StickyScrollContextType {
  scrollX: SharedValue<number>;
}

export const StickyScrollContext = createContext<StickyScrollContextType | null>(null);

export function useStickyScroll() {
  const ctx = useContext(StickyScrollContext);
  if (!ctx) throw new Error('useStickyScroll must be used within StickyScrollView');
  return ctx;
}
