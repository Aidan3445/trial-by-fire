import { useCallback, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Animated } from 'react-native';

const MIN_REFRESH_MS = 1000;

export function useRefresh(keysToInvalidate: (string | number | boolean | undefined)[][] = []) {
  const [refreshing, setRefreshing] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const queryClient = useQueryClient();
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        ...keysToInvalidate.map((queryKey) =>
          queryClient.invalidateQueries({ queryKey })
        ),
        // eslint-disable-next-line no-undef
        new Promise((r) => setTimeout(r, MIN_REFRESH_MS)),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, keysToInvalidate]);
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: false },
  );
  return { refreshing, onRefresh, scrollY, handleScroll, keysToInvalidate };
}
