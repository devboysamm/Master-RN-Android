import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../theme/tokens';

type Props = { width?: number | `${number}%`; height?: number; radius?: number; style?: ViewStyle };

// Static placeholder block. The reference adds a reanimated shimmer; that polish
// (and the reanimated dependency) is deferred to a later task.
export default function Skeleton({ width = '100%', height = 14, radius = 8, style }: Props) {
  return <View style={[styles.base, { width, height, borderRadius: radius }, style]} />;
}

const styles = StyleSheet.create({
  base: { backgroundColor: colors.coralSoft, opacity: 0.55 },
});
