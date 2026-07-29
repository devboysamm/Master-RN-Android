import React, { useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import Icon from './Icon';
import { I } from '../theme/icons';
import { colors } from '../theme/tokens';
import { font } from '../theme/fonts';

type Props = {
  onComplete: () => void;
  label?: string;
  meta?: string;
  done?: boolean;
};

const KNOB = 48;
const PADDING = 4;
const TRACK_H = 56;
const EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const ANIM = { duration: 300, easing: EASE };

/**
 * Drag-to-complete, ported from the reference (react-native-gesture-handler +
 * reanimated). The reference fills the track with expo-linear-gradient; here the
 * fill is drawn with react-native-svg (already a dependency) so no extra native
 * gradient library is pulled in. Drag past 80% of the track to fire onComplete.
 */
export default function SlideToComplete({ onComplete, label = 'Slide to complete', meta, done }: Props) {
  // ALL hooks MUST run on every render — no early returns above this block.
  const [trackWidth, setTrackWidth] = useState(0);
  const x = useSharedValue(0);
  const start = useSharedValue(0);

  const max = Math.max(0, trackWidth - KNOB - PADDING * 2);
  const threshold = max * 0.8;

  const onLayout = (e: LayoutChangeEvent) => setTrackWidth(e.nativeEvent.layout.width);

  const pan = Gesture.Pan()
    .enabled(!done)
    .onStart(() => {
      start.value = x.value;
    })
    .onUpdate((e) => {
      x.value = Math.min(max, Math.max(0, start.value + e.translationX));
    })
    .onEnd(() => {
      if (x.value >= threshold) {
        x.value = withTiming(max, ANIM);
        runOnJS(onComplete)();
      } else {
        x.value = withTiming(0, ANIM);
      }
    });

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + KNOB + PADDING * 2 }));

  // Render the completed state AFTER all hooks have run so React sees the
  // same hook count on every render regardless of `done`.
  if (done) {
    return (
      <View style={[styles.wrap, styles.wrapDone]}>
        <View style={styles.doneRow}>
          <Icon d={I.check} size={20} color={colors.white} strokeWidth={2.6} />
          <Text style={styles.doneLabel}>Completed</Text>
        </View>
        {meta ? <Text style={styles.doneMeta}>{meta}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap} onLayout={onLayout}>
      <Animated.View style={[styles.fill, fillStyle]}>
        <Svg width={Math.max(trackWidth, 1)} height={TRACK_H} style={styles.fillSvg}>
          <Defs>
            <SvgLinearGradient id="slideFill" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0" stopColor={colors.coralDeep} />
              <Stop offset="1" stopColor={colors.coral} />
            </SvgLinearGradient>
          </Defs>
          <Rect x="0" y="0" width={Math.max(trackWidth, 1)} height={TRACK_H} fill="url(#slideFill)" />
        </Svg>
      </Animated.View>
      <View style={styles.labels} pointerEvents="none">
        <Text style={styles.label}>{label}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={styles.endCheck} pointerEvents="none">
        <Icon d={I.check} size={18} color="rgba(255,255,255,0.35)" strokeWidth={2.2} />
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.knob, knobStyle]}>
          <Icon d={I.arrowR} size={20} color={colors.white} strokeWidth={2.4} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: TRACK_H,
    borderRadius: 999,
    backgroundColor: colors.ink,
    padding: PADDING,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    opacity: 0.18,
    overflow: 'hidden',
  },
  fillSvg: { position: 'absolute', left: 0, top: 0 },
  labels: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.white, fontFamily: font('800'), fontSize: 12 },
  meta: { color: 'rgba(255,255,255,0.45)', fontFamily: font('700', 'mono'), fontSize: 9, marginTop: 2, letterSpacing: 0.8 },
  endCheck: { position: 'absolute', right: 20, top: 0, bottom: 0, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    left: PADDING,
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: colors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  wrapDone: { backgroundColor: colors.ok, alignItems: 'center' },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  doneLabel: { color: colors.white, fontFamily: font('700'), fontSize: 14 },
  doneMeta: {
    color: 'rgba(255,255,255,0.7)', fontFamily: font('700', 'mono'),
    fontSize: 10, marginTop: 2, letterSpacing: 0.8,
  },
});
