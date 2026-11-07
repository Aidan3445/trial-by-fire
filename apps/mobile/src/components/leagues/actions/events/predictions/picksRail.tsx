import { type ReactNode, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, type LayoutChangeEvent } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { Check } from 'lucide-react-native';
import { colors } from '~/lib/colors';

/** Hit area of each dot/check, and the space between items */
const DOT = 20;
const GAP = 6;
/** Closest the first/last item gets to the card edge when the rail overflows */
const EDGE = 12;
const HEIGHT = 24;
/** Pill padding and check icon, matching the label row inside it */
const PAD_X = 12;
const CHECK = 13;
const CHECK_GAP = 4;
const DONE_COLOR = '#16a34a';

/** The edge heading toward the new pick moves first, the other edge catches up: a liquid stretch */
const LEAD = { duration: 190, easing: Easing.out(Easing.cubic) };
const TRAIL = { duration: 300, easing: Easing.inOut(Easing.cubic) };
const TRAIL_DELAY = 80;
/** Dots slide out of / into the pill as it passes them */
const SLIDE = { duration: 320, easing: Easing.inOut(Easing.cubic) };
const FADE = { duration: 160 };
/** Label swap: quick cover, hold while the pill moves, then reveal */
const MASK_IN = { duration: 70 };
const MASK_HOLD = TRAIL_DELAY + TRAIL.duration - MASK_IN.duration;
const MASK_OUT = { duration: 160 };

export interface RailStep {
  key: string;
  label: string;
  done: boolean;
}

interface PicksRailProps {
  steps: RailStep[];
  current: number;
  onSelect: (_index: number) => void;
}

/**
 * The current pick is spelled out in a pill; the rest are dots, or checks once made.
 * Moving between picks stretches the pill toward the next one, then lets the old one slide out.
 * Labels are never truncated.
 */
export default function PicksRail({ steps, current, onSelect }: PicksRailProps) {
  const [containerWidth, setContainerWidth] = useState(0);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});

  const index = Math.max(0, Math.min(current, steps.length - 1));
  // Always wide enough for the whole label; it never truncates
  const pillWidthFor = (step: RailStep) => {
    const text = labelWidths[step.key] ?? step.label.length * 7.5;
    return Math.max(DOT, PAD_X * 2 + text + (step.done ? CHECK + CHECK_GAP : 0));
  };

  const pillWidth = pillWidthFor(steps[index]!);
  const total = (steps.length - 1) * (DOT + GAP) + pillWidth;
  // Positions are along the rail; the whole rail then shifts as one to fit the card
  const pillLeft = index * (DOT + GAP);
  const dotX = (k: number) => k < index
    ? k * (DOT + GAP)
    : index * (DOT + GAP) + pillWidth + GAP + (k - index - 1) * (DOT + GAP);

  const shift = railShift({
    containerWidth,
    total,
    pillLeft,
    pillWidth,
    prevLeft: index > 0 ? dotX(index - 1) : null,
    nextRight: index < steps.length - 1 ? dotX(index + 1) + DOT : null,
  });

  const onLayout = (e: LayoutChangeEvent) => setContainerWidth(e.nativeEvent.layout.width);
  const onLabelLayout = (key: string) => (e: LayoutChangeEvent) => {
    const width = Math.ceil(e.nativeEvent.layout.width);
    setLabelWidths((prev) => (prev[key] === width ? prev : { ...prev, [key]: width }));
  };

  return (
    <View className='overflow-hidden' style={{ height: HEIGHT }} onLayout={onLayout}>
      {/* Measures each label once so the pill knows how wide to get; wide box so nothing wraps */}
      <View className='absolute opacity-0 items-start' style={{ width: 1000 }} pointerEvents='none'>
        {steps.map((step) => (
          <Text
            key={step.key}
            allowFontScaling={false}
            onLayout={onLabelLayout(step.key)}
            className='text-xs font-bold uppercase tracking-wide'>
            {step.label}
          </Text>
        ))}
      </View>

      {containerWidth > 0 && (
        <RailTrack shift={shift} width={total + DOT}>
          {steps.map((step, k) => (
            <RailDot
              key={step.key}
              x={k === index ? pillLeft : dotX(k)}
              visible={k !== index}
              done={step.done}
              label={step.label}
              onPress={() => onSelect(k)} />
          ))}
          <RailPill
            left={pillLeft}
            width={pillWidth}
            done={steps[index]!.done}
            steps={steps}
            index={index} />
        </RailTrack>
      )}
    </View>
  );
}

interface RailShiftInput {
  containerWidth: number;
  total: number;
  pillLeft: number;
  pillWidth: number;
  prevLeft: number | null;
  nextRight: number | null;
}

/**
 * How far to slide the rail. If it fits, center it. If not, aim to center the pill, while
 * keeping the neighbors on both sides (the previous and next picks) at least EDGE inside the card.
 * The pill itself always stays EDGE inside, and there's never empty space past the first/last item.
 * If both neighbors can't fit, keep just the pill in view.
 */
function railShift({ containerWidth, total, pillLeft, pillWidth, prevLeft, nextRight }: RailShiftInput) {
  if (total <= containerWidth - EDGE * 2) return (containerWidth - total) / 2;

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const ideal = containerWidth / 2 - (pillLeft + pillWidth / 2);

  // Must hold: no empty space past the first/last item, and the pill stays EDGE inside the card
  const hardMin = Math.max(containerWidth - EDGE - total, EDGE - pillLeft);
  const hardMax = Math.max(hardMin, Math.min(EDGE, containerWidth - EDGE - (pillLeft + pillWidth)));

  // Should hold when there's room: previous and next picks also EDGE inside the card
  const softMin = Math.max(hardMin, prevLeft === null ? -Infinity : EDGE - prevLeft);
  const softMax = Math.min(hardMax, nextRight === null ? Infinity : containerWidth - EDGE - nextRight);

  return softMin <= softMax
    ? clamp(ideal, softMin, softMax)
    : clamp(ideal, hardMin, hardMax);
}

/** Slides the whole rail sideways (a transform, not a scroll view) to keep the current pick in view */
function RailTrack({ shift, width, children }: { shift: number; width: number; children: ReactNode }) {
  const translateX = useSharedValue(shift);

  useEffect(() => {
    translateX.value = withTiming(shift, SLIDE);
  }, [shift, translateX]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateX: translateX.value }] }));

  return (
    // Real width so taps on far dots still land (Android ignores touches outside a parent's bounds)
    <Animated.View className='absolute inset-y-0 left-0' style={[{ width }, style]}>
      {children}
    </Animated.View>
  );
}

interface RailDotProps {
  x: number;
  visible: boolean;
  done: boolean;
  label: string;
  onPress: () => void;
}

function RailDot({ x, visible, done, label, onPress }: RailDotProps) {
  const left = useSharedValue(x);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    left.value = withTiming(x, SLIDE);
  }, [x, left]);

  useEffect(() => {
    // Appear a beat late so the dot emerges from behind the departing pill
    opacity.value = visible ? withDelay(TRAIL_DELAY, withTiming(1, FADE)) : withTiming(0, FADE);
  }, [visible, opacity]);

  const style = useAnimatedStyle(() => ({
    left: left.value,
    opacity: opacity.value,
  }));

  return (
    <Animated.View className='absolute top-0.5' style={[{ width: DOT, height: DOT }, style]}>
      <Pressable
        onPress={onPress}
        disabled={!visible}
        hitSlop={6}
        accessibilityRole='tab'
        accessibilityLabel={`${label}${done ? ' (done)' : ''}`}
        accessibilityState={{ selected: !visible }}
        className='flex-1 items-center justify-center'>
        {done ? (
          <View className='size-4 items-center justify-center rounded-full bg-green-600'>
            <Check size={10} strokeWidth={4} color='white' />
          </View>
        ) : (
          <View className='size-2 rounded-full bg-primary/40' />
        )}
      </Pressable>
    </Animated.View>
  );
}

interface RailPillProps {
  left: number;
  width: number;
  done: boolean;
  steps: RailStep[];
  index: number;
}

function RailPill({ left, width, done, steps, index }: RailPillProps) {
  const leftEdge = useSharedValue(left);
  const rightEdge = useSharedValue(left + width);
  const doneValue = useSharedValue(done ? 1 : 0);
  const previousLeft = useRef(left);

  // The label shown lags the real index: it swaps only once the mask fully covers it
  const [shownIndex, setShownIndex] = useState(index);
  const mask = useSharedValue(0);

  useEffect(() => {
    const right = left + width;
    if (left > previousLeft.current) {
      // Heading right: right edge reaches for the next pick, left edge follows
      rightEdge.value = withTiming(right, LEAD);
      leftEdge.value = withDelay(TRAIL_DELAY, withTiming(left, TRAIL));
    } else if (left < previousLeft.current) {
      leftEdge.value = withTiming(left, LEAD);
      rightEdge.value = withDelay(TRAIL_DELAY, withTiming(right, TRAIL));
    } else {
      leftEdge.value = withTiming(left, TRAIL);
      rightEdge.value = withTiming(right, TRAIL);
    }
    previousLeft.current = left;
  }, [left, width, leftEdge, rightEdge]);

  useEffect(() => {
    if (index === shownIndex) return;
    // Cover the old label, swap underneath, and reveal once the pill has settled
    mask.value = withSequence(
      withTiming(1, MASK_IN, (finished) => {
        if (finished) scheduleOnRN(setShownIndex, index);
      }),
      withDelay(MASK_HOLD, withTiming(0, MASK_OUT)),
    );
  }, [index, shownIndex, mask]);

  useEffect(() => {
    doneValue.value = withTiming(done ? 1 : 0, TRAIL);
  }, [done, doneValue]);

  const style = useAnimatedStyle(() => ({
    left: leftEdge.value,
    width: rightEdge.value - leftEdge.value,
    backgroundColor: interpolateColor(doneValue.value, [0, 1], [colors.primary!, DONE_COLOR]),
  }));

  // Same color as the pill, so the label just disappears into it
  const maskStyle = useAnimatedStyle(() => ({
    opacity: mask.value,
    backgroundColor: interpolateColor(doneValue.value, [0, 1], [colors.primary!, DONE_COLOR]),
  }));

  const shown = steps[Math.min(shownIndex, steps.length - 1)];

  return (
    <Animated.View
      pointerEvents='none'
      className='absolute top-0 overflow-hidden rounded-full'
      style={[{ height: HEIGHT }, style]}>
      {shown && (
        <View
          className='absolute inset-0 flex-row items-center justify-center gap-1'
          style={{ paddingHorizontal: PAD_X }}>
          {shown.done && <Check size={CHECK} strokeWidth={3} color='white' />}
          <Text
            allowFontScaling={false}
            className='text-xs font-bold uppercase tracking-wide text-white'
            style={{ flexShrink: 0 }}>
            {shown.label}
          </Text>
        </View>
      )}
      <Animated.View className='absolute inset-0' style={maskStyle} />
    </Animated.View>
  );
}
