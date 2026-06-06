import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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

/**
 * STATIC placeholder. The reference is an interactive drag-to-complete built on
 * react-native-gesture-handler + reanimated, and marking a lesson complete is
 * progress tracking — both deferred to a later task. This renders the resting
 * affordance only; it does not slide and does not fire onComplete.
 */
export default function SlideToComplete({ label = 'Slide to complete', meta, done }: Props) {
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
    <View style={styles.wrap}>
      <View style={styles.labels} pointerEvents="none">
        <Text style={styles.label}>{label}</Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={styles.endCheck} pointerEvents="none">
        <Icon d={I.check} size={18} color="rgba(255,255,255,0.35)" strokeWidth={2.2} />
      </View>
      <View style={styles.knob}>
        <Icon d={I.arrowR} size={20} color={colors.white} strokeWidth={2.4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: 56,
    borderRadius: 999,
    backgroundColor: colors.ink,
    padding: PADDING,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  labels: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  label: { color: colors.white, fontFamily: font('800'), fontSize: 12 },
  meta: { color: 'rgba(255,255,255,0.45)', fontFamily: font('700', 'mono'), fontSize: 9, marginTop: 2, letterSpacing: 0.8 },
  endCheck: { position: 'absolute', right: 20, top: 0, bottom: 0, justifyContent: 'center' },
  knob: {
    position: 'absolute',
    left: PADDING,
    top: PADDING,
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
