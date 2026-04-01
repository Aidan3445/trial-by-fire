import { useCallback, useRef, useState } from 'react';
import {
  type ScrollView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

interface UseTabsCarouselOptions<T extends string> {
  tabs: readonly [T, ...T[]];
  defaultTab?: T;
  width: number;
}

export function useTabsCarousel<T extends string>({
  tabs,
  defaultTab,
  width,
}: UseTabsCarouselOptions<T>) {
  const scrollRef = useRef<ScrollView>(null);
  const [activeTab, setActiveTab] = useState<T>(defaultTab ?? tabs[0]);
  const isProgrammaticScroll = useRef(false);

  /** Tap → scroll */
  const handleTabChange = useCallback(
    (tab: T) => {
      const index = tabs.indexOf(tab);
      if (index === -1 || !scrollRef.current) return;

      isProgrammaticScroll.current = true;
      setActiveTab(tab);

      scrollRef.current.scrollTo({
        x: index * width,
        animated: true,
      });

      // release after animation finishes
      // eslint-disable-next-line no-undef
      setTimeout(() => {
        isProgrammaticScroll.current = false;
      }, 300);
    },
    [tabs, width]
  );

  /** Swipe → update active tab */
  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isProgrammaticScroll.current) return;

      const offsetX = event.nativeEvent.contentOffset.x;
      const index = Math.round(offsetX / width);
      const tab = tabs[index];

      if (tab && tab !== activeTab) {
        setActiveTab(tab);
      }
    },
    [tabs, width, activeTab]
  );

  return {
    scrollRef,
    activeTab,
    setActiveTab: handleTabChange,
    handleScroll,
  };
}
