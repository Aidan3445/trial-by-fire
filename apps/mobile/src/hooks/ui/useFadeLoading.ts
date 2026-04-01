import { useEffect, useRef, useState } from 'react';
import { Animated } from 'react-native';

type UseFadeLoadingOptions = {
  isLoading: boolean;
  delay?: number;
  duration?: number;
};

export default function useFadeLoading({
  isLoading,
  delay = 50,
  duration = 400
}: UseFadeLoadingOptions) {
  const [showLoading, setShowLoading] = useState(true);
  const hasLoadedOnce = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isLoading && !hasLoadedOnce.current) {
      // eslint-disable-next-line no-undef
      const timeout = setTimeout(() => {
        hasLoadedOnce.current = true;
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }).start(() => setShowLoading(false));
      }, delay);

      // eslint-disable-next-line no-undef
      return () => clearTimeout(timeout);
    }
  }, [isLoading, fadeAnim, delay, duration]);

  return { showLoading, fadeAnim };
}
