import React, { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import useHeaderHeight from '~/hooks/ui/useHeaderHeight';

const LogoImage = require('~/assets/LogoDisc.png');

export default function IOSRefreshIndicator({
  refreshing,
  scrollY,
  logoSize = 60,
  extraHeight,
  alreadySafe
}: {
  refreshing: boolean;
  scrollY: Animated.Value;
  logoSize?: number;
  extraHeight?: number;
  alreadySafe?: boolean;
}) {
  const height = useHeaderHeight(extraHeight);
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotation = useRef(new Animated.Value(0)).current;
  const logoTranslateY = useRef(new Animated.Value(-logoSize - 20)).current;
  const isRefreshingRef = useRef(refreshing);
  const isAnimatingRef = useRef(false);
  const prevRefreshingRef = useRef(refreshing);

  useEffect(() => {
    isRefreshingRef.current = refreshing;
  }, [refreshing]);

  // Animate out when refreshing ends
  useEffect(() => {
    if (prevRefreshingRef.current && !refreshing) {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(logoTranslateY, {
          toValue: -logoSize - 20,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
    prevRefreshingRef.current = refreshing;
  }, [refreshing, logoOpacity, logoTranslateY, logoSize]);

  // Spin animation
  useEffect(() => {
    const spinOnce = () => {
      isAnimatingRef.current = true;
      Animated.timing(logoRotation, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true
      }).start(({ finished }) => {
        if (finished) {
          logoRotation.setValue(0);
          isAnimatingRef.current = false;
          if (isRefreshingRef.current) {
            spinOnce();
          }
        }
      });
    };

    if (refreshing && !isAnimatingRef.current) {
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(logoTranslateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
      spinOnce();
    }
  }, [refreshing, logoRotation, logoOpacity, logoTranslateY, logoSize]);

  const spin = logoRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Scroll-driven visibility
  useEffect(() => {
    const listener = scrollY.addListener(({ value }) => {
      if (value > 0) {
        logoOpacity.setValue(0);
        logoTranslateY.setValue(-logoSize - 20);
      } else if (refreshing && value <= 0) {
        logoOpacity.setValue(1);
        logoTranslateY.setValue(0);
      } else if (value < 0) {
        const pullDistance = Math.abs(value);
        logoOpacity.setValue(Math.min(pullDistance / 100, 1));
        logoTranslateY.setValue(Math.min(pullDistance - logoSize - 20, 0));
      } else {
        logoOpacity.setValue(0);
        logoTranslateY.setValue(-logoSize - 20);
      }
    });
    return () => scrollY.removeListener(listener);
  }, [scrollY, logoOpacity, logoTranslateY, refreshing, logoSize]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: height + (alreadySafe ? -(height / 2 + 20) : 4),
        zIndex: 9,
        opacity: logoOpacity,
        transform: [{ translateY: logoTranslateY }]
      }}
      className='items-center'>
      <Animated.Image
        source={LogoImage}
        style={{
          width: logoSize,
          height: logoSize,
          transform: [{ rotate: spin }]
        }}
        resizeMode='contain' />
    </Animated.View>
  );
}
