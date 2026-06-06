import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from './Icon';
import { colors } from '../theme/tokens';
import { font } from '../theme/fonts';

type Props = {
  title: string;
  subtitle?: string;
  emptyIcon: string;
  emptyTitle: string;
  emptySub: string;
};

/**
 * PLACEHOLDER tab screen. It matches the app's header (big title + subtitle) and
 * empty-state styling so the tab bar is fully functional, but the real screen
 * for this tab is built in its own later task. Do not flesh this out here.
 */
export default function PlaceholderScreen({ title, subtitle, emptyIcon, emptyTitle, emptySub }: Props) {
  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      <View style={styles.empty}>
        <View style={styles.emptyIconWrap}>
          <Icon d={emptyIcon} size={28} color={colors.coral} strokeWidth={2} />
        </View>
        <Text style={styles.emptyTitle}>{emptyTitle}</Text>
        <Text style={styles.emptySub}>{emptySub}</Text>
        <Text style={styles.badge}>PLACEHOLDER</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.cream },
  titleRow: { paddingHorizontal: 16, paddingTop: 14 },
  title: { color: colors.ink, fontFamily: font('800'), fontSize: 32, letterSpacing: -0.7 },
  sub: { color: colors.mute, fontFamily: font('700'), fontSize: 14, marginTop: 4 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingBottom: 110, // clear the floating tab bar
  },
  emptyIconWrap: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.coralSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: { color: colors.ink, fontFamily: font('800'), fontSize: 22, textAlign: 'center' },
  emptySub: { color: colors.mute, fontFamily: font('600'), fontSize: 16, textAlign: 'center', marginTop: 6 },
  badge: { color: colors.coralDeep, fontFamily: font('700', 'mono'), fontSize: 11, letterSpacing: 1.4, marginTop: 18 },
});
