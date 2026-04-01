import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export function useAnimatedVisibility(visible: boolean, duration = 200) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: visible ? 1 : 0,
      duration,
      useNativeDriver: true,
    }).start();
  }, [visible, anim, duration]);

  return anim;
}

